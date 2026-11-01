import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { forbidden, notFound, permanentRedirect, redirect, unauthorized } from 'next/navigation'
import { login, logout } from 'payload/auth'
import config from '@payload-config'
import { getPayloadClient } from './payload'

// Payload owns password checks, tokens, session expiry and session revocation.
// CMS admins are never accepted as generated-app users.
const appCookieName = (prefix: string) => `__Host-${prefix}-voyagevista-token`

async function appSessionHeaders() {
  const store = await cookies()
  const payload = await getPayloadClient()
  const token = store.get(appCookieName(payload.config.cookiePrefix))?.value
  const headers = new Headers({ DisableAutologin: 'true' })
  if (token) headers.set('Authorization', `JWT ${token}`)
  return headers
}

// Use Payload's public server-function adapter contract. Only the transport of
// its cookie changes; signing, password checks, expiry and revocation remain in
// Payload. A host-only CHIPS cookie works in a cross-site preview iframe without
// competing with the platform's CMS/admin cookie or exposing a token to JS.
const appServerAdapter: Parameters<typeof login>[0]['serverAdapter'] = {
  forbidden,
  notFound,
  permanentRedirect,
  redirect,
  unauthorized,
  getHeaders: appSessionHeaders,
  getCookies: async () => {
    const store = await cookies()
    const payload = await getPayloadClient()
    const canonicalName = `${payload.config.cookiePrefix}-token`
    const token = store.get(appCookieName(payload.config.cookiePrefix))?.value
    return {
      get: (name) => (name === canonicalName && token ? { name, value: token } : undefined),
      getAll: () => (token ? [{ name: canonicalName, value: token }] : []),
    }
  },
  setCookie: async (name, value, options) => {
    const payload = await getPayloadClient()
    if (name !== `${payload.config.cookiePrefix}-token`) throw new Error('Onbekend sessiecookie.')
    ;(await cookies()).set(appCookieName(payload.config.cookiePrefix), value, {
      ...options,
      domain: undefined,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
    })
  },
}

async function readAppUser() {
  const cookieStore = await cookies()
  if (!cookieStore.getAll().length) return null
  const payload = await getPayloadClient()
  // Read the cookie name from the running, normalized Payload instance. The
  // exported config can still be an unsanitized build/preview configuration.
  const token = cookieStore.get(appCookieName(payload.config.cookiePrefix))?.value
  if (!token) return null
  // Verify the app cookie explicitly instead of forwarding preview/proxy
  // identities or relying on cookie-auth metadata in forwarded headers.
  // Payload still validates the session; Next keeps Server Action origin checks.
  const authHeaders = new Headers({ Authorization: `JWT ${token}`, DisableAutologin: 'true' })
  const { user } = await payload.auth({ headers: authHeaders })
  return user?.collection === 'users' ? user : null
}

export const appAuth = {
  currentUser: cache(readAppUser),
  async login(email: string, password: string) {
    const result = await login({
      collection: 'users',
      config,
      email,
      password,
      serverAdapter: appServerAdapter,
    })
    if (!result.user) throw new Error('Inloggen is mislukt.')
    // Do not reuse a cached anonymous result from earlier in registration.
    const user = await readAppUser()
    if (!user || user.id !== result.user.id) throw new Error('De sessie kon niet worden bevestigd.')
    // Discard the old prototype cookie when switching to Payload-managed sessions.
    ;(await cookies()).delete('app-session')
  },
  async logout() {
    const result = await logout({ config, allSessions: false, serverAdapter: appServerAdapter })
    if (!result.success) throw new Error('Uitloggen is mislukt.')
    // Also expire an invalid/revoked app cookie with the same partition/scope.
    const payload = await getPayloadClient()
    await appServerAdapter.setCookie(`${payload.config.cookiePrefix}-token`, '', {
      expires: new Date(0),
      maxAge: 0,
    })
    ;(await cookies()).delete('app-session')
  },
}
