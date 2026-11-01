'use server'

import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import { loginFailure, validateCredentials, type AuthResult } from '@/lib/auth-validation'

export async function loginAction(_: AuthResult, formData: FormData): Promise<AuthResult> {
  const { email, password, errors, valid } = validateCredentials(formData)
  if (!valid) return { ok: false, message: 'Controleer je gegevens.', errors }
  try {
    await appAuth.login(email, password)
  } catch (error) {
    return loginFailure(error)
  }
  // Redirect only after Payload has written and verified the session cookie.
  // Keep this outside catch: Next implements redirects by throwing internally.
  // The next request checks whether the browser actually returned the cookie.
  redirect('/mijn-account?auth=check')
}

export async function registerAction(_: AuthResult, formData: FormData): Promise<AuthResult> {
  const { name, email, password, errors, valid } = validateCredentials(formData, true)
  if (!valid) return { ok: false, message: 'Controleer je gegevens.', errors }
  try {
    const payload = await getPayloadClient()
    const user = await appAuth.currentUser()
    if (user) return { ok: false, message: 'Log eerst uit om een nieuw account aan te maken.' }
    await payload.create({
      collection: 'users',
      data: { name, email, password, role: 'customer' },
      draft: false,
      overrideAccess: false,
    })
  } catch {
    return {
      ok: false,
      message:
        'Account aanmaken is niet gelukt. Heb je al een account? Log dan in of neem contact op met Voyage Vista.',
    }
  }
  try {
    await appAuth.login(email, password)
  } catch {
    return {
      ok: false,
      accountCreated: true,
      message: 'Je account is aangemaakt. Log in om verder te gaan.',
    }
  }
  redirect('/mijn-account?auth=check')
}

export async function logoutAction(): Promise<AuthResult> {
  try {
    await appAuth.logout()
    return { ok: true, message: 'Je bent uitgelogd.' }
  } catch {
    return { ok: false, message: 'Uitloggen is niet gelukt. Probeer het opnieuw.' }
  }
}
