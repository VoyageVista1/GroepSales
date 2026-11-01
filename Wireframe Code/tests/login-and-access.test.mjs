import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { validateCredentials, loginFailure, loginMessages } from '../src/lib/auth-validation.ts'
import * as validation from '../src/lib/voyage-validation.ts'
import { loadSource } from './source-loader.mjs'
const wishValidation = loadSource('lib/travel-wish.ts')
const bookingRules = loadSource('lib/booking-rules.ts')

const require = createRequire(import.meta.url)
function load(path, imports = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => {
        if (name in imports) return imports[name]
        if (name === '@/lib/auth-validation')
          return { validateCredentials, loginFailure, loginMessages }
        if (name.endsWith('/travel-wish') || name === './travel-wish') return wishValidation
        if (name === './booking-rules') return bookingRules
        if (name === './voyage-validation') return validation
        if (name.startsWith('node:')) return require(name)
        throw new Error(`Unexpected dependency: ${name}`)
      },
      FormData,
      Headers,
      Date,
      Object,
      Number,
      Error,
      String,
    },
    { filename: path },
  )
  return module.exports
}
const form = (fields) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

function sessionModule({
  token,
  user,
  onAuth = () => {},
  loginUser = user,
  persistCookie = true,
  configCookiePrefix = 'voyage',
  runtimeCookiePrefix = 'voyage',
  onSetCookie = () => {},
  onLogoutHeaders = () => {},
  platformToken,
} = {}) {
  const appCookie = `__Host-${runtimeCookiePrefix}-voyagevista-token`
  const jar = new Map(token ? [[appCookie, { value: token }]] : [])
  if (platformToken) jar.set(`${runtimeCookiePrefix}-token`, { value: platformToken })
  const { appAuth } = load('../src/lib/app-auth.ts', {
    'server-only': {},
    react: { cache: (fn) => fn },
    'next/headers': {
      cookies: async () => ({
        get: (name) => jar.get(name),
        getAll: () => [...jar].map(([name, cookie]) => ({ name, ...cookie })),
        delete: (name) => jar.delete(name),
        set: (name, value, options) => {
          jar.set(name, { value })
          onSetCookie(name, value, options)
        },
      }),
    },
    'next/navigation': {
      forbidden() {},
      notFound() {},
      permanentRedirect() {},
      redirect() {},
      unauthorized() {},
    },
    '@payload-config': {
      __esModule: true,
      default: Promise.resolve({ cookiePrefix: configCookiePrefix }),
    },
    './payload': {
      getPayloadClient: async () => ({
        config: { cookiePrefix: runtimeCookiePrefix },
        auth: async ({ headers }) => {
          onAuth(headers)
          return { user }
        },
      }),
    },
    'payload/auth': {
      login: async ({ serverAdapter }) => {
        if (persistCookie)
          await serverAdapter.setCookie(`${runtimeCookiePrefix}-token`, 'new-test-token', {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            expires: new Date(Date.now() + 7200000),
          })
        return { user: loginUser }
      },
      logout: async ({ serverAdapter }) => {
        onLogoutHeaders(await serverAdapter.getHeaders())
        await serverAdapter.setCookie(`${runtimeCookiePrefix}-token`, '', {
          expires: new Date(0),
          maxAge: 0,
        })
        return { success: true }
      },
    },
  })
  return appAuth
}

function pageHarness(user, data = { customers: [] }, failure = null) {
  let dataReads = 0
  const element = (type, props) => ({ type, props })
  const component = (name) => ({ __esModule: true, default: name })
  const { default: HomePage } = load('../src/app/(frontend)/mijn-account/page.tsx', {
    react: { Suspense: 'suspense' },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'next/navigation': {
      redirect: (location) => {
        throw Object.assign(new Error('redirect'), { location })
      },
    },
    '@/lib/app-auth': { appAuth: { currentUser: async () => user } },
    '@/lib/voyage-data': {
      loadVoyageVistaData: async () => {
        dataReads++
        if (failure) throw failure
        return data
      },
    },
    '@/lib/public-catalog': { loadPublicTrips: async () => [{ id: 'published-trip' }] },
    '../AccountPending': component('pending-account'),
    '../ErrorBoundary': component('error-boundary'),
    '../VoyageVista': component('app'),
    '../LogoutButton': component('logout'),
  })
  return {
    render: async (params) => {
      const root = HomePage({ searchParams: Promise.resolve(params) })
      const child = root.props.children
      return child.type(child.props)
    },
    dataReads: () => dataReads,
  }
}

test('the private route redirects visitors without querying private app data', async () => {
  const page = pageHarness(null)
  await assert.rejects(
    page.render({ auth: 'check' }),
    (error) => error.location === '/inloggen?auth=check',
  )
  assert.equal(page.dataReads(), 0)
  await assert.rejects(page.render({}), (error) => error.location === '/inloggen')
})

test('a successful login clears its marker before opening the app', async () => {
  const page = pageHarness({ collection: 'users', role: 'staff', id: 'staff-id' })
  await assert.rejects(
    page.render({ auth: 'check' }),
    (error) => error.location === '/mijn-account',
  )
  assert.equal(page.dataReads(), 0)
  const result = await page.render({})
  assert.equal(result.type, 'error-boundary')
  assert.equal(result.props.children.type, 'app')
  assert.equal(page.dataReads(), 1)
})

test('the public home never reads a session or private collections', async () => {
  const publicTrips = [{ id: 'published-trip' }]
  const { default: HomePage } = load('../src/app/(frontend)/page.tsx', {
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@/lib/public-catalog': { loadPublicTrips: async () => publicTrips },
    './PublicHome': { __esModule: true, default: 'public-home' },
  })
  const result = await HomePage()
  assert.equal(result.type, 'public-home')
  assert.equal(result.props.trips, publicTrips)
})

test('home navigation returns only a verified role without exposing a user document', async () => {
  let user = null
  const { getNavigationRole } = load('../src/actions/navigation.ts', {
    '@/lib/app-auth': { appAuth: { currentUser: async () => user } },
  })
  assert.equal(await getNavigationRole(), null)
  for (const role of ['staff', 'customer']) {
    user = { id: 'private-id', role, email: 'private@example.nl', token: 'private-token' }
    assert.equal(await getNavigationRole(), role)
  }
  user = { role: 'admin' }
  assert.equal(await getNavigationRole(), null)
})

test('the login route shows a session notice and sends authenticated users to their account', async () => {
  let user = null
  const { default: LoginPage } = load('../src/app/(frontend)/inloggen/page.tsx', {
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'next/navigation': {
      redirect: (location) => {
        throw Object.assign(new Error('redirect'), { location })
      },
    },
    '@/lib/app-auth': { appAuth: { currentUser: async () => user } },
    '../AuthPanel': { __esModule: true, default: 'login' },
  })
  const form = await LoginPage({ searchParams: Promise.resolve({ auth: 'check' }) })
  assert.equal(form.type, 'login')
  assert.match(form.props.initialMessage, /sessie is niet teruggekomen/)
  for (const [reason, message] of Object.entries(loginMessages)) {
    const failed = await LoginPage({ searchParams: Promise.resolve({ auth: reason }) })
    assert.equal(failed.props.initialMessage, message)
  }
  user = { id: 'app-user', collection: 'users', role: 'staff' }
  await assert.rejects(
    LoginPage({ searchParams: Promise.resolve({}) }),
    (error) => error.location === '/mijn-account',
  )
})

test('an unlinked customer does not trigger the private queries that produced Forbidden', async () => {
  const { loadVoyageVistaData } = load('../src/lib/voyage-data.ts', {
    'server-only': {},
    'next/cache': { unstable_cache: (fn) => fn },
    './voyage-cache': { VOYAGE_CATALOG_TAG: 'catalog' },
    './payload': {
      getPayloadClient: async () => {
        throw new Error('Unlinked customer must not initialize Payload')
      },
    },
  })
  for (const customer of [null, undefined, '', { id: '' }]) {
    assert.equal(
      await loadVoyageVistaData({ collection: 'users', role: 'customer', customer }),
      null,
    )
  }
  const page = pageHarness({ role: 'customer', collection: 'users' }, null)
  const result = await page.render({})
  assert.equal(result.type, 'pending-account')
  assert.equal(result.props.trips[0].id, 'published-trip')
})

test('a staff account with no linked customer and no customers retains its workspace', async () => {
  const page = pageHarness({ role: 'staff', collection: 'users', name: 'Medewerker' })
  const result = await page.render({})
  assert.equal(result.type, 'error-boundary')
  assert.equal(result.props.children.type, 'app')
  assert.equal(result.props.children.props.trips[0].id, 'published-trip')
})

test('a customer whose linked profile is no longer readable still receives the travel home', async () => {
  const page = pageHarness({ role: 'customer', customer: 'missing', name: 'Klant' })
  const result = await page.render({})
  assert.equal(result.type, 'pending-account')
  assert.equal(result.props.name, 'Klant')
  assert.equal(result.props.trips[0].id, 'published-trip')
})

test('a linked customer read retains collection access checks and authenticated identity', async () => {
  const user = {
    id: 'app-account',
    collection: 'users',
    role: 'customer',
    customer: 'customer-id',
    name: 'Test',
    email: 'test@voorbeeld.nl',
  }
  const calls = []
  const { loadVoyageVistaData } = load('../src/lib/voyage-data.ts', {
    'server-only': {},
    'next/cache': { unstable_cache: (fn) => fn },
    './voyage-cache': { VOYAGE_CATALOG_TAG: 'catalog' },
    './payload': {
      getPayloadClient: async () => ({
        find: async (options) => {
          calls.push(options)
          return { docs: [] }
        },
      }),
    },
  })
  assert.ok(await loadVoyageVistaData(user))
  for (const options of calls) {
    assert.equal(options.overrideAccess, false)
    if (
      ['customers', 'bookings', 'quotes', 'customer-questions', 'messages', 'favorites'].includes(
        options.collection,
      )
    )
      assert.equal(options.user, user)
  }
  assert.ok(calls.some((options) => options.collection === 'customers'))
})

test('the public catalog selects published trips anonymously and removes private metadata', async () => {
  let options, cacheOptions
  const { loadPublicTrips } = load('../src/lib/public-catalog.ts', {
    'server-only': {},
    'next/cache': {
      unstable_cache: (fn, keys, config) => {
        cacheOptions = config
        return fn
      },
    },
    './voyage-cache': { VOYAGE_CATALOG_TAG: 'voyage-trips' },
    './payload': {
      getPayloadClient: async () => ({
        find: async (args) => {
          options = args
          return {
            docs: [
              {
                id: 'trip-id',
                title: 'Reis',
                destination: { name: 'Bestemming', country: 'Land', privateMetadata: 'hidden' },
                image: { url: '/api/media/file/trip.jpg', alt: 'Reisfoto', createdBy: 'admin-id' },
                startDate: '2027-06-01',
                endDate: '2027-06-08',
                duration: 7,
                price: 900,
                maxTravellers: 4,
                available: true,
                description: 'Beschrijving',
                facilities: null,
                createdBy: 'admin-id',
                legacySnapshot: { customerEmail: 'private@voorbeeld.nl' },
              },
            ],
          }
        },
      }),
    },
  })
  const trips = await loadPublicTrips()
  assert.equal(options.collection, 'trips')
  assert.equal(options.overrideAccess, false)
  assert.equal(options.draft, false)
  assert.equal(options.where._status.equals, 'published')
  assert.equal('user' in options, false)
  assert.equal(trips[0].image, '/api/media/file/trip.jpg')
  assert.equal(trips[0].country, 'Land')
  assert.doesNotMatch(JSON.stringify(trips), /admin-id|private@|legacySnapshot|privateMetadata/)
  assert.equal(cacheOptions.tags[0], 'voyage-trips')
})

test('catalog changes expire the public cache for the next request', async () => {
  const calls = []
  const { invalidateVoyageCatalog } = load('../src/lib/voyage-cache.ts', {
    'next/cache': { revalidateTag: (...args) => calls.push(args) },
  })
  const doc = { id: 'trip-id' }
  assert.equal(await invalidateVoyageCatalog({ doc }), doc)
  assert.equal(calls[0][0], 'voyage-trips')
  assert.equal(calls[0][1].expire, 0)
})

test('the account page renders an access notice on Forbidden without bypassing permissions', async () => {
  const page = pageHarness(
    { collection: 'users', role: 'customer', customer: 'customer-id' },
    null,
    { status: 403 },
  )
  const result = await page.render({})
  assert.equal(result.type, 'main')
  assert.match(JSON.stringify(result), /Je account heeft nog geen toegang/)
})

test('no app cookie returns anonymous without initializing Payload', async () => {
  let calls = 0
  const auth = sessionModule({ onAuth: () => calls++ })
  assert.equal(await auth.currentUser(), null)
  assert.equal(calls, 0)
})

test('app authentication verifies the configured cookie without preview headers or admin autologin', async () => {
  const user = { id: 'app-user', collection: 'users', role: 'staff' }
  const auth = sessionModule({
    token: 'test-token',
    user,
    onAuth: (headers) => {
      assert.equal(headers.get('Authorization'), 'JWT test-token')
      assert.equal(headers.get('DisableAutologin'), 'true')
      assert.equal(headers.has('Cookie'), false)
      assert.equal(headers.has('Origin'), false)
    },
  })
  assert.equal(await auth.currentUser(), user)
  assert.equal(
    await sessionModule({
      token: 'admin-token',
      user: { collection: 'admins', id: 'admin' },
    }).currentUser(),
    null,
  )
})

test('login must confirm the newly written cookie rather than reusing an anonymous result', async () => {
  const user = { id: 'app-user', collection: 'users', role: 'staff' }
  const auth = sessionModule({ user })
  assert.equal(await auth.currentUser(), null)
  await auth.login('test@voorbeeld.nl', 'test password')
  assert.equal(await auth.currentUser(), user)
  await assert.rejects(
    sessionModule({ user, persistCookie: false }).login('test@voorbeeld.nl', 'test password'),
    /sessie/,
  )
})

test('session reads use the runtime cookie prefix instead of an incomplete preview config', async () => {
  const user = { id: 'app-user', collection: 'users', role: 'staff' }
  const auth = sessionModule({
    token: 'test-token',
    user,
    configCookiePrefix: null,
    runtimeCookiePrefix: 'preview-runtime',
  })
  assert.equal(await auth.currentUser(), user)
  await auth.login('test@voorbeeld.nl', 'test password')
  assert.equal(await auth.currentUser(), user)
})

test('app sessions use a secure partitioned HttpOnly cookie separate from CMS authentication', async () => {
  const written = []
  const user = { id: 'app-user', collection: 'users', role: 'staff' }
  const auth = sessionModule({
    user,
    platformToken: 'cms-token',
    onSetCookie: (...args) => written.push(args),
  })
  assert.equal(await auth.currentUser(), null)
  await auth.login('test@voorbeeld.nl', 'test password')
  const [name, value, options] = written[0]
  assert.equal(name, '__Host-voyage-voyagevista-token')
  assert.equal(value, 'new-test-token')
  assert.equal(options.httpOnly, true)
  assert.equal(options.secure, true)
  assert.equal(options.partitioned, true)
  assert.equal(options.sameSite, 'none')
  assert.equal(options.path, '/')
  assert.equal(options.domain, undefined)
  assert.ok(options.expires > new Date())
  assert.equal(
    written.some(([key]) => key === 'voyage-token'),
    false,
  )
})

test('logout uses and expires the app session without forwarding a platform administrator cookie', async () => {
  const written = []
  let header
  const auth = sessionModule({
    token: 'app-token',
    platformToken: 'cms-token',
    user: { id: 'app-user', collection: 'users' },
    onSetCookie: (...args) => written.push(args),
    onLogoutHeaders: (headers) => (header = headers),
  })
  await auth.logout()
  assert.equal(header.get('Authorization'), 'JWT app-token')
  assert.equal(header.get('DisableAutologin'), 'true')
  assert.equal(header.has('Cookie'), false)
  const [name, value, options] = written.at(-1)
  assert.equal(name, '__Host-voyage-voyagevista-token')
  assert.equal(value, '')
  assert.equal(options.partitioned, true)
  assert.equal(options.expires.getTime(), 0)
  assert.equal(
    written.some(([key]) => key === 'voyage-token'),
    false,
  )
})

test('login normalizes email and preserves exact password, including spaces', () => {
  const result = validateCredentials(
    form({ email: '  Gebruiker@Voorbeeld.nl ', password: '  geheim  ' }),
  )
  assert.equal(result.valid, true)
  assert.equal(result.email, 'gebruiker@voorbeeld.nl')
  assert.equal(result.password, '  geheim  ')
  assert.equal(validateCredentials(form({ email: 'a@b.nl', password: 'short' })).valid, true)
})

test('registration rejects mismatched passwords, invalid fields and file uploads', () => {
  const data = form({ name: 'A', email: 'onjuist', password: 'kort', confirmPassword: 'anders' })
  assert.deepEqual(Object.keys(validateCredentials(data, true).errors), [
    'name',
    'email',
    'password',
    'confirmPassword',
  ])
  data.set('email', new Blob(['a@b.nl']), 'email.txt')
  assert.equal(validateCredentials(data).valid, false)
})

test('login validates before auth and redirects on the server after success', async () => {
  const calls = []
  const actions = load('../src/actions/auth.ts', {
    'next/navigation': {
      redirect: (location) => {
        throw Object.assign(new Error('redirect'), { location })
      },
    },
    '@/lib/app-auth': {
      appAuth: {
        login: async (...args) => {
          calls.push(args)
          return { token: 'private-token' }
        },
      },
    },
    '@/lib/payload': {
      getPayloadClient: async () => {
        throw new Error('Unexpected database call')
      },
    },
    '@/lib/auth-validation': { validateCredentials, loginFailure, loginMessages },
  })
  assert.equal((await actions.loginAction({}, form({ email: 'invalid', password: '' }))).ok, false)
  assert.equal(calls.length, 0)
  await assert.rejects(
    actions.loginAction({}, form({ email: ' Test@Voorbeeld.nl ', password: ' geheim ' })),
    (error) => error.location === '/mijn-account?auth=check',
  )
  assert.deepEqual(calls[0], ['test@voorbeeld.nl', ' geheim '])
})

test('failed login keeps the form usable and does not redirect or expose backend details', async () => {
  let redirects = 0
  const actions = load('../src/actions/auth.ts', {
    'next/navigation': { redirect: () => redirects++ },
    '@/lib/app-auth': {
      appAuth: {
        login: async () => {
          throw Object.assign(new Error('private details'), { status: 401 })
        },
      },
    },
    '@/lib/payload': {},
    '@/lib/auth-validation': { validateCredentials, loginFailure, loginMessages },
  })
  const result = await actions.loginAction(
    {},
    form({ email: 'test@voorbeeld.nl', password: 'incorrect' }),
  )
  assert.equal(result.ok, false)
  assert.equal(redirects, 0)
  assert.match(result.message, /Controleer je e-mailadres en wachtwoord/)
  assert.doesNotMatch(result.message, /private details/)
})

test('registration redirects outside its catch after the account and session are created', async () => {
  const calls = []
  const actions = load('../src/actions/auth.ts', {
    'next/navigation': {
      redirect: (location) => {
        throw Object.assign(new Error('redirect'), { location })
      },
    },
    '@/lib/app-auth': {
      appAuth: { currentUser: async () => null, login: async () => calls.push('login') },
    },
    '@/lib/payload': {
      getPayloadClient: async () => ({ create: async () => calls.push('create') }),
    },
    '@/lib/auth-validation': { validateCredentials, loginFailure, loginMessages },
  })
  await assert.rejects(
    actions.registerAction(
      {},
      form({
        name: 'Testklant',
        email: 'test@voorbeeld.nl',
        password: 'test password',
        confirmPassword: 'test password',
      }),
    ),
    (error) => error.location === '/mijn-account?auth=check',
  )
  assert.deepEqual(calls, ['create', 'login'])
})

test('an account created without a usable session shows the login recovery instead of redirecting', async () => {
  let redirects = 0
  const actions = load('../src/actions/auth.ts', {
    'next/navigation': { redirect: () => redirects++ },
    '@/lib/app-auth': {
      appAuth: {
        currentUser: async () => null,
        login: async () => {
          throw Error('session failure')
        },
      },
    },
    '@/lib/payload': { getPayloadClient: async () => ({ create: async () => ({}) }) },
    '@/lib/auth-validation': { validateCredentials, loginFailure, loginMessages },
  })
  const result = await actions.registerAction(
    {},
    form({
      name: 'Testklant',
      email: 'test@voorbeeld.nl',
      password: 'test password',
      confirmPassword: 'test password',
    }),
  )
  assert.equal(result.ok, false)
  assert.equal(result.accountCreated, true)
  assert.equal(redirects, 0)
})

test('an accepted quote retry reuses its existing booking without changing the status again', async () => {
  const calls = []
  const user = { collection: 'users', role: 'customer', customer: 'own-customer' }
  const actions = server(user, {
    find: async (args) => ({
      docs:
        args.collection === 'quotes'
          ? [{ id: 'quote-id', status: 'Geaccepteerd', number: 'OFF-1' }]
          : [{ id: 'existing-booking' }],
    }),
    create: async (args) => {
      calls.push(args)
    },
    update: async (args) => {
      calls.push(args)
    },
  })
  assert.equal((await actions.acceptQuoteAction('OFF-1')).ok, true)
  assert.equal(calls.length, 0)
})

test('Dutch amounts, traveller counts and real calendar dates are validated', () => {
  assert.equal(validation.parseEuroAmount('€ 1.234,56'), 1234.56)
  for (const value of ['-12', '€ abc123', '1,234', 'NaN', '', '1.23'])
    assert.equal(validation.parseEuroAmount(value), undefined)
  assert.equal(validation.parseTravellers('2 personen'), 2)
  for (const value of [0, 21, 2.5, '2abc'])
    assert.equal(validation.parseTravellers(value), undefined)
  assert.equal(validation.validDateRange('2027-02-30', '2027-03-04'), false)
  assert.equal(validation.validDateRange('2027-03-03', '2027-03-01'), false)
  assert.equal(validation.validDateRange('2027-03-01', '2027-03-03'), true)
})

function server(user, payload) {
  return load('../src/actions/voyage.ts', {
    '@/lib/app-auth': { appAuth: { currentUser: async () => user } },
    '@/lib/payload': { getPayloadClient: async () => payload },
    '@/lib/voyage-validation': validation,
  })
}

test('anonymous and customer accounts cannot invoke staff operations', async () => {
  const forbiddenPayload = new Proxy(
    {},
    {
      get() {
        throw new Error('Unexpected database call')
      },
    },
  )
  for (const user of [null, { collection: 'users', role: 'customer', id: 'account-id' }]) {
    const actions = server(user, forbiddenPayload)
    for (const name of [
      'saveCustomerAction',
      'saveBookingAction',
      'saveQuoteAction',
      'updateQuestionAction',
      'addQuestionMessageAction',
    ]) {
      assert.equal((await actions[name]({ role: 'staff' })).ok, false)
    }
  }
})

test('customer ownership, workflow and reference are determined by the server', async () => {
  const calls = []
  const user = {
    collection: 'users',
    role: 'customer',
    id: 'account-id',
    customer: { id: 'own-customer' },
  }
  const actions = server(user, {
    create: async (options) => {
      calls.push(options)
      return { id: 'question-id', reference: options.data.reference }
    },
  })
  const result = await actions.createQuestionAction({
    subject: 'Reisadvies',
    message: 'Ik wil graag advies.',
    customer: 'someone-else',
    reference: 'FAKE',
    status: 'Afgesloten',
    role: 'staff',
    travellers: 2,
  })
  assert.equal(result.ok, true)
  assert.equal(calls[0].data.customer, 'own-customer')
  assert.equal(calls[0].data.status, 'Nieuw')
  assert.notEqual(calls[0].data.reference, 'FAKE')
  assert.equal(result.reference, calls[0].data.reference)
  assert.equal(calls[0].overrideAccess, false)
  assert.equal(calls[0].user, user)
})

test('database failures return a displayable error without server details', async () => {
  const actions = server(
    { collection: 'users', role: 'customer', customer: 'own-customer' },
    {
      create: async () => {
        throw new Error('private backend details')
      },
    },
  )
  const result = await actions.createQuestionAction({ subject: 'Advies', message: 'Mijn vraag.' })
  assert.equal(result.ok, false)
  assert.ok(result.message)
  assert.doesNotMatch(result.message, /private backend/)
})

test('staff input allowlist discards injected fields before creating a customer', async () => {
  let saved
  const actions = server(
    { collection: 'users', role: 'staff', id: 'staff-id' },
    {
      create: async (args) => {
        saved = args
        return { id: 'new-id' }
      },
    },
  )
  assert.equal(
    (
      await actions.saveCustomerAction({
        name: 'Testpersoon',
        email: 'test@voorbeeld.nl',
        phone: '0612345678',
        role: 'admin',
        password: 'injected',
      })
    ).ok,
    true,
  )
  assert.deepEqual(Object.keys(saved.data).sort(), ['customerType', 'email', 'name', 'phone'])
  assert.equal(saved.overrideAccess, false)
})

test('customers cannot read internal notes or messages belonging to other customers', () => {
  const schema = load('../src/lib/voyage-schema.ts', {
    payload: { APIError: Error, ValidationError: Error },
  })
  const { Messages } = load('../src/collections/Messages.ts', { '../lib/voyage-schema': schema })
  const read = (user) => Messages.access.read({ req: { user } })
  assert.equal(read(null), false)
  assert.equal(read({ collection: 'users', role: 'customer' }), false)
  assert.equal(read({ collection: 'users', role: 'staff' }), true)
  assert.equal(read({ collection: 'admins' }), true)
  const policy = read({ collection: 'users', role: 'customer', customer: 'own-customer' })
  assert.equal(policy.and[0]['question.customer'].equals, 'own-customer')
  assert.equal(policy.and[1].kind.not_equals, 'internalNote')
})
