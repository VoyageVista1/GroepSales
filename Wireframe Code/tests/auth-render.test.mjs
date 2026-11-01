import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToString } from 'react-dom/server'
import ts from 'typescript'
import { getImgProps } from 'next/dist/shared/lib/get-img-props.js'
import { imageConfigDefault } from 'next/dist/shared/lib/image-config.js'
import { figmaNextImageLoader } from '@payloadcms/figma/next-image-loader'
import { loadSource } from './source-loader.mjs'
const wishValidation = loadSource('lib/travel-wish.ts')
const bookingRules = loadSource('lib/booking-rules.ts')
import { trips, appData } from './frontend-fixtures.mjs'

const require = createRequire(import.meta.url)
const cache = new Map()
let screenOverride = null
let imageProps = []
let actionBindings = []
const authActions = {
  loginAction: async () => ({ ok: false, message: '' }),
  registerAction: async () => ({ ok: false, message: '' }),
  logoutAction: async () => ({ ok: true, message: '' }),
}
function component(file) {
  if (cache.has(file)) return cache.get(file)
  const source = fs.readFileSync(
    new URL(
      `../src/app/(frontend)/${file}.${file === 'travelRules' ? 'ts' : 'tsx'}`,
      import.meta.url,
    ),
    'utf8',
  )
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => {
        if (name === 'react')
          return {
            ...React,
            useActionState: (...args) => {
              actionBindings.push(args)
              return React.useActionState(...args)
            },
            useState: (initial) =>
              React.useState(
                screenOverride && (initial === 'dashboard' || initial === 'discover')
                  ? screenOverride
                  : initial,
              ),
          }
        if (name === 'react/jsx-runtime') return require(name)
        if (name.startsWith('./')) return component(name.slice(2))
        if (name === 'next/navigation') return { useRouter: () => ({ refresh() {} }) }
        if (name === 'next/link')
          return { __esModule: true, default: (props) => React.createElement('a', props) }
        if (name === 'next/image')
          return {
            __esModule: true,
            default: (props) => {
              imageProps.push(props)
              const { fill, priority, ...htmlProps } = props
              return React.createElement('img', htmlProps)
            },
          }
        if (name === '@/lib/travel-wish') return wishValidation
        if (name === '@/lib/browser-login') return loadSource('lib/browser-login.ts')
        if (name === '@/lib/booking-rules') return bookingRules
        if (name === '@/lib/travel-pricing') return loadSource('lib/travel-pricing.ts')
        if (name === '@/actions/voyage') return {}
        if (name === '@/actions/navigation') return { getNavigationRole: async () => null }
        if (name === '@/actions/auth') return authActions
        throw new Error(`Unexpected render dependency: ${name}`)
      },
    },
    { filename: file },
  )
  cache.set(file, module.exports)
  return module.exports
}

test('the login shell is server-rendered with its public link before the form', () => {
  const { default: AuthPanel } = component('AuthPanel')
  const html = renderToString(React.createElement(AuthPanel))
  assert.match(html, /href="\/"/)
  assert.match(html, /Reizen bekijken zonder account/)
  assert.ok(html.indexOf('Reizen bekijken zonder account') < html.indexOf('MIJN VOYAGE VISTA'))
  assert.match(html, /id="auth-email"/)
  assert.match(html, /id="auth-password"/)
})

test('login uses a native POST with named credentials instead of Server Action transport', () => {
  actionBindings = []
  const html = renderToString(React.createElement(component('AuthFormPanel').default))
  assert.match(html, /<form[^>]*action="\/api\/app-auth"[^>]*method="post"/)
  assert.match(html, /name="email"/)
  assert.match(html, /name="password"/)
  assert.doesNotMatch(html, /action="javascript:/)
})

test('linked and unlinked customers receive the same home content as anonymous visitors', () => {
  const PublicHome = component('PublicHome').default
  const App = component('VoyageVista').default
  const AccountPending = component('AccountPending').default
  const render = (Component, props) => renderToString(React.createElement(Component, props))
  const anonymous = render(PublicHome, { trips })
  const linked = render(App, { data: appData(), trips })
  const unlinked = render(AccountPending, { trips, name: 'Testaccount' })
  const main = (html) => html.match(/<main[\s\S]*?<\/main>/)[0]
  for (const html of [anonymous, linked]) {
    assert.match(html, /Testreis Portugal/)
    assert.match(html, /Dien je reiswens in/)
    assert.match(html, /id="reisaanbod"/)
  }
  assert.equal(main(anonymous), main(unlinked))
  assert.match(linked, /Welkom, <!-- -->Testaccount/)
  assert.match(unlinked, /Je bent ingelogd en kunt alle reizen bekijken/)
  assert.doesNotMatch(unlinked, /Account wacht op koppeling/)
  assert.equal(linked, render(App, { data: appData(), trips }))
})

test('a staff workspace renders without a linked customer or existing customer records', () => {
  const App = component('VoyageVista').default
  const html = renderToString(React.createElement(App, { data: appData('staff'), trips }))
  assert.match(html, /WERKRUIMTE/)
  assert.match(html, /Klantvragen/)
  assert.doesNotMatch(html, /Account wacht op koppeling/)
})

test('successive initial server renders are identical and retain the session notice', () => {
  const { default: AuthPanel } = component('AuthPanel')
  const props = { initialMessage: 'Controleer je sessie.' }
  const render = () => renderToString(React.createElement(AuthPanel, props))
  assert.equal(render(), render())
  assert.match(render(), /Controleer je sessie/)
  assert.match(render(), /role="alert"/)
})

test('every employee workspace and customer subpage renders without a runtime error', () => {
  const App = component('VoyageVista').default
  for (const [role, screens] of [
    ['staff', ['dashboard', 'customers', 'trips', 'quotes', 'bookings']],
    ['customer', ['discover', 'trip', 'favorites', 'contact', 'wish']],
  ]) {
    for (const screen of screens) {
      screenOverride = screen
      try {
        const html = renderToString(React.createElement(App, { data: appData(role), trips }))
        assert.match(html, /<main/)
        assert.match(html, /<h1/)
        assert.doesNotMatch(html, /undefined|NaN/)
      } finally {
        screenOverride = null
      }
    }
  }
})

test('checkout renders an explicit package total, service fee and option-booking confirmation', () => {
  const { BookingCheckout } = component('CustomerForms')
  const html = renderToString(
    React.createElement(BookingCheckout, {
      travel: appData().travelProposals[0],
      name: 'Testklant',
      email: 'qa@voorbeeld.nl',
      onCancel() {},
      onBooked() {},
    }),
  )
  assert.match(html, /Servicekosten/)
  assert.match(html, /Totaal voor het reisgezelschap/)
  assert.match(html, /type="checkbox"/)
  assert.match(html, /Boek reis als optie/)
  assert.match(html, /geen betaling afgeschreven/)
})

test('only the public hero is eager while travel cards retain lazy loading', () => {
  const PublicHome = component('PublicHome').default
  const html = renderToString(React.createElement(PublicHome, { trips }))
  assert.equal((html.match(/loading="eager"/g) ?? []).length, 1)
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, trips.length)
  assert.match(html, /fetchPriority="high"/)
})

test('reusing the hero upload in a lazy card cannot overwrite its Next LCP image entry', () => {
  imageProps = []
  renderToString(
    React.createElement(component('PublicHome').default, {
      trips: trips.map((trip) => ({
        ...trip,
        image: '/api/media/file/voyage-vista-travel-6-original.jpg',
      })),
    }),
  )
  const state = {
    imgConf: {
      ...imageConfigDefault,
      loader: 'custom',
      allSizes: [...imageConfigDefault.deviceSizes, ...imageConfigDefault.imageSizes].sort(
        (a, b) => a - b,
      ),
    },
    defaultLoader: figmaNextImageLoader,
  }
  const images = imageProps.map((props) => getImgProps(props, state))
  const eager = images.find((image) => image.props.loading === 'eager')
  const lazy = images.find((image) => image.props.loading === 'lazy')
  assert.notEqual(eager.props.src, lazy.props.src)
  assert.equal(eager.props.fetchPriority, 'high')
  assert.equal(eager.meta.preload, false)
  assert.equal(lazy.meta.preload, false)
})

test('the not-found page uses Dutch copy and usable return links', () => {
  const html = renderToString(React.createElement(component('not-found').default))
  assert.match(html, /Deze bestemming bestaat niet/)
  assert.match(html, /href="\/mijn-account"/)
  assert.doesNotMatch(html, /text-blue-600|text-zinc-600|Page Not Found/)
})
