import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { loadSource } from './source-loader.mjs'

const { loginWithBrowserSession } = loadSource('lib/browser-login.ts')
const credentials = () => {
  const form = new FormData()
  form.set('email', 'test@voorbeeld.nl')
  form.set('password', 'synthetic test password')
  return form
}
async function listen(t, handler) {
  const server = createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  )
  return `http://127.0.0.1:${server.address().port}`
}

test('real fetch follows a same-origin 308 before posting credentials to the canonical endpoint', async (t) => {
  const posts = []
  let cookie = ''
  const origin = await listen(t, async (req, res) => {
    const url = new URL(req.url, 'http://fixture.example')
    if (url.pathname === '/api/app-auth') {
      assert.equal(req.method, 'GET', 'credentials must not be posted before endpoint discovery')
      res.writeHead(308, { Location: `/gateway/auth/login${url.search}` }).end()
      return
    }
    if (req.method === 'POST') {
      let body = ''
      for await (const part of req) body += part
      posts.push({ path: url.pathname, fields: new URLSearchParams(body) })
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'test-session=accepted; Path=/; HttpOnly',
      })
      res.end(JSON.stringify({ ok: true, phase: 'credentials' }))
      return
    }
    const ok = req.headers.cookie === 'test-session=accepted'
    res.writeHead(ok ? 200 : 401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok, phase: 'session', ...(ok ? {} : { reason: 'session' }) }))
  })
  const browserTransport = async (url, init) => {
    const headers = new Headers(init.headers)
    if (cookie) headers.set('cookie', cookie)
    const response = await fetch(url, { ...init, headers })
    if (response.headers.has('set-cookie'))
      cookie = response.headers.get('set-cookie').split(';')[0]
    return response
  }
  // Reproduce the previous transport bug against the same real HTTP endpoint.
  await assert.rejects(fetch(`${origin}/api/app-auth`, { redirect: 'error' }), TypeError)
  const result = await loginWithBrowserSession(
    credentials(),
    browserTransport,
    `${origin}/inloggen`,
  )
  assert.equal(result.ok, true)
  assert.equal(posts.length, 1)
  assert.equal(posts[0].path, '/gateway/auth/login')
  assert.equal(posts[0].fields.get('password'), 'synthetic test password')
})

test('a redirect to a different origin cannot receive a credential POST', async (t) => {
  let posts = 0
  const destination = await listen(t, (req, res) => {
    if (req.method === 'POST') posts++
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, phase: 'session', reason: 'session' }))
  })
  const origin = await listen(t, (req, res) => {
    if (req.method === 'POST') posts++
    res.writeHead(308, { Location: `${destination}/auth/login` }).end()
  })
  const result = await loginWithBrowserSession(credentials(), fetch, `${origin}/inloggen`)
  assert.equal(result.ok, false)
  assert.equal(posts, 0)
})
