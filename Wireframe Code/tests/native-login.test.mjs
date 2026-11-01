import test from 'node:test'
import assert from 'node:assert/strict'
import * as validation from '../src/lib/auth-validation.ts'
import { loadSource } from './source-loader.mjs'

function route(login, env = {}) {
  return loadSource(
    'app/(frontend)/auth/login/route.ts',
    {
      '@/lib/app-auth': { appAuth: { login } },
      '@/lib/auth-validation': validation,
    },
    { process: { env } },
  ).POST
}

function request(fields = { email: ' Test@Voorbeeld.nl ', password: ' geheim ' }, headers = {}) {
  return new Request('https://full-preview.example/auth/login', {
    method: 'POST',
    headers: {
      origin: 'https://full-preview.example',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: new URLSearchParams(fields),
  })
}

test('a native form login authenticates and redirects by HTTP 303 without a Server Action header', async () => {
  const calls = []
  const response = await route(async (...args) => calls.push(args))(
    request({
      email: ' Test@Voorbeeld.nl ',
      password: ' geheim ',
      redirect: 'https://attacker.example',
      role: 'staff',
    }),
  )
  assert.deepEqual(calls, [['test@voorbeeld.nl', ' geheim ']])
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), '/mijn-account?auth=check')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('x-action-redirect'), null)
  assert.equal(await response.text(), '')
})

test('native login validates before authentication and displays a safe error after redirect', async () => {
  let calls = 0
  const response = await route(async () => calls++)(request({ email: 'invalid', password: '' }))
  assert.equal(calls, 0)
  assert.equal(response.headers.get('location'), '/inloggen?auth=form-invalid')
})

test('failed native login never leaks credentials or backend errors into the redirect', async () => {
  for (const [status, reason] of [
    [401, 'invalid'],
    [429, 'rate-limit'],
    [500, 'unavailable'],
  ]) {
    const response = await route(async () => {
      throw Object.assign(new Error('private backend data'), { status })
    })(request())
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('location'), `/inloggen?auth=${reason}`)
    assert.doesNotMatch(JSON.stringify([...response.headers]), /geheim|Test@|private backend/)
  }
})

test('a genuine same-origin form survives a different internal proxy hostname', async () => {
  let calls = 0
  const handler = route(async () => calls++)
  const response = await handler(
    new Request('http://internal-preview:3000/auth/login', {
      method: 'POST',
      headers: {
        origin: 'https://full-preview.example',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email: 'test@voorbeeld.nl', password: 'password' }),
    }),
  )
  assert.equal(calls, 1)
  assert.equal(response.headers.get('location'), '/mijn-account?auth=check')
})

test('cross-origin login posts are rejected before using credentials', async () => {
  let calls = 0
  for (const headers of [
    { origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' },
    { origin: 'null', 'sec-fetch-site': 'same-origin' },
    { origin: 'https://attacker.example/path', 'sec-fetch-site': 'same-origin' },
  ]) {
    const response = await route(async () => calls++)(request(undefined, headers))
    assert.equal(response.headers.get('location'), '/inloggen?auth=origin')
  }
  assert.equal(calls, 0)
})

test('oversized or unexpected request bodies do not reach authentication', async () => {
  let calls = 0
  const handler = route(async () => calls++)
  const oversized = await handler(
    request({ email: 'test@voorbeeld.nl', password: 'x'.repeat(20_000) }),
  )
  const json = await handler(request(undefined, { 'content-type': 'application/json' }))
  assert.equal(oversized.headers.get('location'), '/inloggen?auth=form-invalid')
  assert.equal(json.headers.get('location'), '/inloggen?auth=form-invalid')
  assert.equal(calls, 0)
})

test('JSON login never redirects and returns no user document or token', async () => {
  const response = await route(async () => ({
    token: 'private-token',
    user: { email: 'private@example.nl' },
  }))(request(undefined, { accept: 'application/json' }))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('vary'), 'Accept')
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.doesNotMatch(JSON.stringify(body), /private-token|private@example/)
})

test('the API URL delegates login and session checks to the same secured handlers', async () => {
  const calls = []
  const { GET, POST } = loadSource('app/(frontend)/api/app-auth/route.ts', {
    '@/lib/app-auth': {
      appAuth: { login: async (...args) => calls.push(args), currentUser: async () => null },
    },
    '@/lib/auth-validation': validation,
  })
  assert.equal((await GET()).status, 401)
  const response = await POST(
    new Request('https://full-preview.example/api/app-auth', {
      method: 'POST',
      headers: {
        origin: 'https://full-preview.example',
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email: 'test@voorbeeld.nl', password: 'synthetic password' }),
    }),
  )
  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['test@voorbeeld.nl', 'synthetic password']])
  assert.equal((await response.json()).phase, 'credentials')
})

test('session probe tests the incoming browser session without exposing account details', async () => {
  for (const user of [
    null,
    { collection: 'users', id: 'private-id', email: 'private@example.nl' },
  ]) {
    const { GET } = loadSource('app/(frontend)/auth/login/route.ts', {
      '@/lib/app-auth': { appAuth: { currentUser: async () => user } },
      '@/lib/auth-validation': validation,
    })
    const response = await GET()
    assert.equal(response.status, user ? 200 : 401)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    const body = await response.json()
    assert.equal(body.ok, Boolean(user))
    assert.doesNotMatch(JSON.stringify(body), /private-id|private@example/)
  }
})
