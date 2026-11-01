import { appAuth } from '@/lib/app-auth'
import {
  loginFailure,
  loginMessages,
  validateCredentials,
  type LoginFailureReason,
} from '@/lib/auth-validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Native forms receive a redirect; fetch receives JSON at the same URL.
const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Accept' }

function redirectTo(location: string) {
  // A relative Location stays on the actual preview host behind the Make proxy.
  // 303 changes the native form POST into a GET; credentials never enter a URL.
  return new Response(null, {
    status: 303,
    headers: { ...privateHeaders, Location: location },
  })
}
function failed(request: Request, reason: LoginFailureReason) {
  if (request.headers.get('accept')?.includes('application/json')) {
    const status =
      reason === 'origin'
        ? 403
        : reason === 'invalid'
          ? 401
          : reason === 'rate-limit'
            ? 429
            : reason === 'form-invalid'
              ? 400
              : 503
    return Response.json(
      { ok: false, phase: 'credentials', reason, message: loginMessages[reason] },
      { status, headers: privateHeaders },
    )
  }
  return redirectTo(`/inloggen?auth=${reason}`)
}

export async function GET() {
  try {
    const user = await appAuth.currentUser()
    return Response.json(
      user
        ? { ok: true, phase: 'session', message: 'Sessie bevestigd.' }
        : { ok: false, phase: 'session', reason: 'session', message: loginMessages.session },
      {
        status: user ? 200 : 401,
        headers: privateHeaders,
      },
    )
  } catch {
    return Response.json(
      { ok: false, phase: 'session', reason: 'unavailable', message: loginMessages.unavailable },
      { status: 503, headers: privateHeaders },
    )
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return false
  try {
    if (new URL(origin).origin !== origin) return false
    // Browsers set this forbidden-to-script header from the form's actual
    // origin. Unlike forwarded hostnames, it survives a change of proxy host.
    if (request.headers.get('sec-fetch-site') === 'same-origin') return true
    if (origin === new URL(request.url).origin) return true
    const preview = process.env.FIGMA_PUBLIC_URL
    return !!preview && origin === new URL(preview).origin
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  // Route Handlers do not inherit Server Actions' automatic origin check.
  if (!sameOrigin(request)) return failed(request, 'origin')
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded')
    return failed(request, 'form-invalid')
  const reader = request.body?.getReader()
  if (!reader) return failed(request, 'form-invalid')
  let body = ''
  let bytes = 0
  const decoder = new TextDecoder()
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > 16_384) {
        await reader.cancel()
        return failed(request, 'form-invalid')
      }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
  } catch {
    return failed(request, 'form-invalid')
  } finally {
    reader.releaseLock()
  }
  const fields = new FormData()
  for (const [key, value] of new URLSearchParams(body)) fields.append(key, value)
  const { email, password, valid } = validateCredentials(fields)
  if (!valid) return failed(request, 'form-invalid')
  try {
    // Payload continues to own credential verification and the HttpOnly cookie.
    await appAuth.login(email, password)
  } catch (error) {
    return failed(request, loginFailure(error).reason)
  }
  if (request.headers.get('accept')?.includes('application/json'))
    return Response.json(
      { ok: true, phase: 'credentials', message: 'Gegevens gecontroleerd.' },
      { headers: privateHeaders },
    )
  return redirectTo('/mijn-account?auth=check')
}
