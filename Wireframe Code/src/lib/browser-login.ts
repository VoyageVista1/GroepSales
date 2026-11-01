import { loginMessages, validateCredentials, type AuthResult } from './auth-validation'

// No token or password is stored in browser storage. The GET is a separate
// browser request: reading an outgoing cookie during POST cannot prove that the
// browser accepted it in an embedded preview.
export async function loginWithBrowserSession(
  data: FormData,
  request: typeof fetch = fetch,
  pageURL: string | undefined = typeof window === 'undefined' ? undefined : window.location.href,
): Promise<AuthResult> {
  const credentials = validateCredentials(data)
  if (!credentials.valid)
    return { ok: false, message: 'Controleer je gegevens.', errors: credentials.errors }
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), 15_000)
  const failure = (reason: 'response' | 'session' | 'network' | 'timeout'): AuthResult => ({
    ok: false,
    reason,
    message: loginMessages[reason],
  })
  let stage: 'start' | 'login' | 'session' = 'start'
  let route: 'API' | 'LEGACY' = 'API'
  const protocolFailure = (response: Response, problem: string): AuthResult => ({
    ...failure('response'),
    // Only fixed labels and an HTTP status are exposed, never response bodies,
    // URLs, account details or backend exception messages.
    message: `${loginMessages.response} (VV-AUTH-${stage.toUpperCase()}-${route}-${response.status}-${problem})`,
  })
  const read = async (
    response: Response,
    phase: 'credentials' | 'session',
  ): Promise<AuthResult | 'HTML' | 'JSON' | 'FORMAT' | 'VERSION'> => {
    let body: unknown
    try {
      // A proxy may change Content-Type. Parse data without executing it, then
      // validate our protocol; HTML and unrelated JSON still fail closed.
      body = await response.json()
    } catch {
      return response.headers.get('content-type')?.includes('text/html') ? 'HTML' : 'JSON'
    }
    if (!body || typeof body !== 'object' || !('ok' in body) || typeof body.ok !== 'boolean')
      return 'FORMAT'
    const reason =
      'reason' in body &&
      typeof body.reason === 'string' &&
      Object.hasOwn(loginMessages, body.reason)
        ? (body.reason as keyof typeof loginMessages)
        : undefined
    if ('phase' in body) {
      if (body.phase !== phase) return 'VERSION'
    } else {
      // Older copies of the same handler did not include phase. Recognize only
      // their exact success messages, never an arbitrary { ok: true } response.
      const legacyMessage = phase === 'session' ? 'Sessie bevestigd.' : 'Gegevens gecontroleerd.'
      if (body.ok ? !('message' in body) || body.message !== legacyMessage : !reason)
        return 'VERSION'
    }
    if (!body.ok && !reason) return 'FORMAT'
    return { ok: response.ok && body.ok, reason, message: reason ? loginMessages[reason] : '' }
  }
  try {
    let endpoint: string | undefined
    const probe = (url: string) => `${url}${url.includes('?') ? '&' : '?'}verify=${Date.now()}`
    const options: RequestInit = {
      credentials: 'same-origin',
      mode: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
      signal: abort.signal,
      headers: { Accept: 'application/json' },
    }
    // Resolve same-origin canonicalization without sending credentials first.
    // redirect:'error' incorrectly reports even an ordinary 307/308 as a lost
    // connection. mode:'same-origin' prevents forwarding to another origin.
    let lastFailure = failure('response')
    for (const path of ['/api/app-auth', '/auth/login']) {
      route = path === '/api/app-auth' ? 'API' : 'LEGACY'
      const candidate = pageURL ? new URL(path, pageURL).href : path
      const health = await request(probe(candidate), { ...options, method: 'GET' })
      // Check the final origin even in non-browser transports that don't enforce
      // mode:'same-origin'. No password has been sent during discovery.
      let canonical: URL | undefined
      if (health.url) {
        if (!pageURL) return protocolFailure(health, 'ORIGIN')
        canonical = new URL(health.url)
        if (canonical.origin !== new URL(pageURL).origin) return protocolFailure(health, 'ORIGIN')
        canonical.searchParams.delete('verify')
      }
      const ready = await read(health, 'session')
      if (typeof ready === 'string') {
        lastFailure = protocolFailure(health, ready)
        continue
      }
      if (!ready.ok && !(health.status === 401 && ready.reason === 'session'))
        return { ...ready, message: ready.message || loginMessages.unavailable }
      endpoint = canonical?.href ?? candidate
      break
    }
    if (!endpoint) return lastFailure
    stage = 'login'
    const response = await request(endpoint, {
      ...options,
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: credentials.email, password: credentials.password }),
    })
    const result = await read(response, 'credentials')
    if (typeof result === 'string') return protocolFailure(response, result)
    if (!result.ok) return { ...result, message: result.message || loginMessages.unavailable }
    stage = 'session'
    const verification = await request(probe(endpoint), { ...options, method: 'GET' })
    const session = await read(verification, 'session')
    if (typeof session === 'string') return protocolFailure(verification, session)
    if (!session.ok)
      return {
        ...session,
        reason: session.reason ?? 'session',
        message: session.message || loginMessages.session,
      }
    return { ok: true, message: 'Je bent ingelogd. Je omgeving wordt geopend.' }
  } catch {
    if (abort.signal.aborted) return failure('timeout')
    return {
      ...failure('network'),
      message:
        stage === 'start'
          ? 'De preview kan de inlogserver niet bereiken. Je e-mailadres en wachtwoord zijn nog niet verstuurd.'
          : stage === 'session'
            ? 'Je inloggegevens zijn gecontroleerd, maar de verbinding viel weg tijdens de sessiecontrole. Probeer opnieuw.'
            : loginMessages.network,
    }
  } finally {
    clearTimeout(timer)
  }
}
