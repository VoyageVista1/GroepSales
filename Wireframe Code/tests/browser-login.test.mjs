import test from 'node:test'
import assert from 'node:assert/strict'
import * as validation from '../src/lib/auth-validation.ts'
import { loadSource } from './source-loader.mjs'

const { loginWithBrowserSession } = loadSource('lib/browser-login.ts')
const form = () => {
  const data = new FormData()
  data.set('email', ' Test@Voorbeeld.nl ')
  data.set('password', ' secret password ')
  return data
}

test('login checks the endpoint, authenticates and then confirms the browser session', async () => {
  const calls = []
  const result = await loginWithBrowserSession(form(), async (url, options) => {
    calls.push({ url, options })
    return Response.json({ ok: true, phase: options.method === 'POST' ? 'credentials' : 'session' })
  })
  assert.equal(result.ok, true)
  assert.equal(calls.length, 3)
  assert.equal(calls[0].options.method, 'GET')
  assert.equal(calls[0].options.body, undefined)
  assert.equal(calls[1].options.method, 'POST')
  assert.equal(calls[1].options.body.get('email'), 'test@voorbeeld.nl')
  assert.equal(calls[1].options.body.get('password'), ' secret password ')
  assert.equal(calls[2].options.method, 'GET')
  assert.match(calls[2].url, /^\/api\/app-auth\?verify=/)
  assert.ok(
    calls.every(
      ({ options }) =>
        options.credentials === 'same-origin' &&
        options.cache === 'no-store' &&
        options.redirect === 'follow' &&
        options.mode === 'same-origin',
    ),
  )
})

test('a refused browser cookie keeps the user on the form instead of reporting login success', async () => {
  let calls = 0
  const result = await loginWithBrowserSession(form(), async () => {
    calls++
    return calls === 2
      ? Response.json({ ok: true, phase: 'credentials' })
      : Response.json({ ok: false, phase: 'session', reason: 'session' }, { status: 401 })
  })
  assert.equal(calls, 3)
  assert.equal(result.ok, false)
  assert.match(result.message, /niet worden teruggelezen/)
})

test('an HTML fallback or package.json response cannot be mistaken for a successful login', async () => {
  for (const response of [
    new Response('<html>Login</html>', { headers: { 'content-type': 'text/html' } }),
    Response.json({ name: 'figma-make-app', private: true, scripts: { build: 'payload build' } }),
    new Response('{broken', { headers: { 'content-type': 'application/json' } }),
  ]) {
    let calls = 0
    const result = await loginWithBrowserSession(form(), async () => {
      calls++
      return response.clone()
    })
    assert.equal(calls, 2)
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'response')
    assert.match(result.message, /VV-AUTH-START-LEGACY-200-(HTML|FORMAT|JSON)/)
  }
})

test('a missing API route uses the verified legacy handler with only one credential POST', async () => {
  const calls = []
  const result = await loginWithBrowserSession(form(), async (url, options) => {
    calls.push({ url, method: options.method })
    if (url.startsWith('/api/'))
      return new Response('<html>Not found</html>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      })
    return Response.json({ ok: true, phase: options.method === 'POST' ? 'credentials' : 'session' })
  })
  assert.equal(result.ok, true)
  assert.equal(calls.length, 4)
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1)
  assert.equal(calls[2].url, '/auth/login')
})

test('older handler replies without phase and JSON labeled text/plain remain compatible', async () => {
  let calls = 0
  const result = await loginWithBrowserSession(form(), async (_url, options) => {
    calls++
    const body =
      calls === 1
        ? { ok: false, reason: 'session' }
        : {
            ok: true,
            message: options.method === 'POST' ? 'Gegevens gecontroleerd.' : 'Sessie bevestigd.',
          }
    return new Response(JSON.stringify(body), {
      status: calls === 1 ? 401 : 200,
      headers: { 'content-type': 'text/plain' },
    })
  })
  assert.equal(result.ok, true)
  assert.equal(calls, 3)
})

test('an unrelated JSON success cannot authorize a credential POST', async () => {
  let posts = 0
  const result = await loginWithBrowserSession(form(), async (_url, options) => {
    if (options.method === 'POST') posts++
    return Response.json({ ok: true })
  })
  assert.equal(result.ok, false)
  assert.equal(posts, 0)
  assert.match(result.message, /VV-AUTH-START-LEGACY-200-VERSION/)
})

test('an HTML POST reply reports the step and status without retrying credentials or leaking content', async () => {
  let posts = 0
  const result = await loginWithBrowserSession(form(), async (_url, options) => {
    if (options.method === 'GET') return Response.json({ ok: true, phase: 'session' })
    posts++
    return new Response('<html>private backend stack trace</html>', {
      status: 502,
      headers: { 'content-type': 'text/html' },
    })
  })
  assert.equal(result.ok, false)
  assert.equal(posts, 1)
  assert.match(result.message, /VV-AUTH-LOGIN-API-502-HTML/)
  assert.doesNotMatch(result.message, /private backend/)
})

test('wrong credentials display a known error without a session probe or backend details', async () => {
  let calls = 0
  const result = await loginWithBrowserSession(form(), async () => {
    calls++
    if (calls === 1)
      return Response.json({ ok: false, phase: 'session', reason: 'session' }, { status: 401 })
    return Response.json(
      { ok: false, phase: 'credentials', reason: 'invalid', message: 'private backend details' },
      { status: 401 },
    )
  })
  assert.equal(calls, 2)
  assert.equal(result.ok, false)
  assert.equal(result.message, validation.loginMessages.invalid)
  assert.doesNotMatch(result.message, /private backend/)
})

test('network failure returns an inline error rather than triggering page navigation', async () => {
  const result = await loginWithBrowserSession(form(), async () => {
    throw Error('failed to fetch')
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'network')
  assert.match(result.message, /nog niet verstuurd/)
})

test('a redirected POST that returns a session reply is not treated as credential validation', async () => {
  let calls = 0
  const result = await loginWithBrowserSession(form(), async () => {
    calls++
    return Response.json({ ok: true, phase: 'session' })
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'response')
  assert.equal(calls, 2)
})

test('an unavailable endpoint stops before any password is posted', async () => {
  let posts = 0
  const result = await loginWithBrowserSession(form(), async (_url, options) => {
    if (options.method === 'POST') posts++
    return Response.json({ ok: false, phase: 'session', reason: 'unavailable' }, { status: 503 })
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'unavailable')
  assert.equal(posts, 0)
})

test('an unavailable session backend remains distinguishable from a rejected browser cookie', async () => {
  let calls = 0
  const result = await loginWithBrowserSession(form(), async () => {
    calls++
    if (calls === 1)
      return Response.json({ ok: false, phase: 'session', reason: 'session' }, { status: 401 })
    return calls === 2
      ? Response.json({ ok: true, phase: 'credentials' })
      : Response.json({ ok: false, phase: 'session', reason: 'unavailable' }, { status: 503 })
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'unavailable')
  assert.equal(result.message, validation.loginMessages.unavailable)
})

test('an aborted request returns a timeout error and releases the form', async () => {
  const { loginWithBrowserSession: timedLogin } = loadSource(
    'lib/browser-login.ts',
    {},
    {
      setTimeout: (callback) => {
        callback()
        return 0
      },
      clearTimeout() {},
    },
  )
  const result = await timedLogin(form(), async (_url, options) => {
    assert.equal(options.signal.aborted, true)
    throw Error('aborted')
  })
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'timeout')
})

test('client transport and the real HTTP handlers agree on accepted and refused sessions', async () => {
  for (const acceptsCookie of [true, false]) {
    let browserSession = false
    let loginCalls = 0
    const route = loadSource('app/(frontend)/auth/login/route.ts', {
      '@/lib/app-auth': {
        appAuth: {
          login: async () => {
            loginCalls++
            browserSession = acceptsCookie
          },
          currentUser: async () =>
            browserSession ? { collection: 'users', id: 'test-user' } : null,
        },
      },
      '@/lib/auth-validation': validation,
    })
    const result = await loginWithBrowserSession(form(), async (url, options) => {
      if (options.method === 'GET') return route.GET()
      return route.POST(
        new Request(new URL(url, 'https://preview.example'), {
          ...options,
          headers: {
            ...options.headers,
            origin: 'https://preview.example',
            'sec-fetch-site': 'same-origin',
          },
        }),
      )
    })
    assert.equal(loginCalls, 1)
    assert.equal(result.ok, acceptsCookie)
  }
})
