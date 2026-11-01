import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './source-loader.mjs'

class APIError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}
const schema = loadSource('lib/voyage-schema.ts', {
  payload: { APIError, ValidationError: APIError },
})
const { ensureCustomerProfile } = loadSource('lib/customer-profile.ts')
const { travelWishErrors } = loadSource('lib/travel-wish.ts')
const { bookingPrice } = loadSource('lib/booking-rules.ts')
const user = {
  id: 'account-uuid',
  collection: 'users',
  role: 'customer',
  customer: 'own-profile',
  name: 'Testklant',
  email: 'gedeeld@voorbeeld.nl',
}
const futureTrip = {
  id: 'trip-uuid',
  _status: 'published',
  available: true,
  title: 'Testreis',
  startDate: '2099-06-01T00:00:00.000Z',
  endDate: '2099-06-08T00:00:00.000Z',
  maxTravellers: 6,
  remainingSpots: 6,
  price: 1000,
  parts: [],
}
const actions = (identity, payload) =>
  loadSource('actions/voyage.ts', {
    '@/lib/app-auth': { appAuth: { currentUser: async () => identity } },
    '@/lib/payload': { getPayloadClient: async () => payload },
    '@/lib/travel-wish': loadSource('lib/travel-wish.ts'),
    '@/lib/voyage-validation': loadSource('lib/voyage-validation.ts'),
  })
const record = (overrides = {}) => ({
  trip: futureTrip.id,
  customer: 'forged-profile',
  travellers: 2,
  totalAmount: 2078,
  ...overrides,
})
function request({ trip = futureTrip, bookings = [] } = {}) {
  const calls = []
  const req = {
    user,
    payload: {
      findByID: async (options) => {
        calls.push(options)
        return trip
      },
      find: async (options) => {
        calls.push(options)
        return { docs: bookings }
      },
    },
  }
  return { req, calls }
}

test('new customer profiles are keyed by account ID and never claimed by email', async () => {
  const calls = []
  const unlinked = { ...user, customer: null }
  const req = {
    payload: {
      find: async (options) => {
        calls.push(options)
        return { docs: [] }
      },
      create: async (options) => {
        calls.push(options)
        return { id: 'new-profile' }
      },
      findByID: async (options) => {
        calls.push(options)
        return unlinked
      },
      update: async (options) => {
        calls.push(options)
        return { ...unlinked, customer: options.data.customer }
      },
    },
  }
  const linked = await ensureCustomerProfile(unlinked, req)
  assert.equal(linked.customer, 'new-profile')
  assert.equal(calls[0].where.legacyId.equals, `app-account:${user.id}`)
  assert.equal(calls[1].data.email, user.email)
  assert.ok(calls.every((options) => options.req === req))
  assert.equal(
    calls.find((options) => options.collection === 'users' && options.data)?.data.customer,
    'new-profile',
  )
})

test('existing links and staff accounts remain unchanged', async () => {
  const forbidden = new Proxy(
    {},
    {
      get() {
        throw Error('Unexpected profile write')
      },
    },
  )
  assert.equal(await ensureCustomerProfile(user, forbidden), user)
  const staff = { ...user, role: 'staff', customer: null }
  assert.equal(await ensureCustomerProfile(staff, forbidden), staff)
})

test('profile activation updates only the authenticated account; the hook owns the link', async () => {
  let saved
  const result = await actions(
    { ...user, customer: null },
    {
      update: async (options) => {
        saved = options
      },
    },
  ).activateCustomerProfileAction()
  assert.equal(result.ok, true)
  assert.equal(saved.id, user.id)
  assert.deepEqual(Object.keys(saved.data), ['name'])
  assert.equal(saved.overrideAccess, false)
  assert.equal(saved.user.id, user.id)
})

test('travel wishes accept flexible dates and validate budget, real dates and party size', () => {
  const wish = {
    destination: 'Nog te bepalen',
    period: 'Twee weken in de zomer; flexibel',
    travellers: 3,
    message: 'Natuur, trein en een kleinschalig verblijf.',
  }
  assert.equal(Object.keys(travelWishErrors(wish)).length, 0)
  for (const patch of [
    { destination: '' },
    { period: '' },
    { travellers: 0 },
    { travellers: 2.5 },
    { travellers: 21 },
    { budgetMax: -10 },
    { budgetMax: NaN },
    { budgetMax: 12.345 },
    { startDate: '2099-02-30', endDate: '2099-03-02' },
    { startDate: '2099-06-02', endDate: '2099-06-01' },
    { startDate: '2099-06-02' },
    { message: 'x'.repeat(5001) },
  ])
    assert.ok(Object.keys(travelWishErrors({ ...wish, ...patch })).length)
})

test('a travel wish persists in the existing inbox with its complete preferences and owner', async () => {
  let saved
  const result = await actions(user, {
    create: async (options) => {
      saved = options
      return { reference: options.data.reference }
    },
  }).createQuestionAction({
    subject: 'Reiswens: Japan',
    category: 'Reiswens',
    destination: 'Japan',
    period: 'Mei 2099, twee weken',
    startDate: '2099-05-01',
    endDate: '2099-05-14',
    travellers: 2,
    budgetMax: 6000,
    budget: '€ 6.000 totaal',
    departure: 'Trein vanuit Utrecht',
    message: 'Natuur en kleine hotels.',
    customer: 'other-profile',
    status: 'Afgesloten',
    specialist: 'Injected',
  })
  assert.equal(result.ok, true)
  assert.equal(saved.collection, 'customer-questions')
  assert.equal(saved.data.customer, user.customer)
  assert.equal(saved.data.destinationLabel, 'Japan')
  assert.equal(saved.data.departureLabel, 'Trein vanuit Utrecht')
  assert.equal(saved.data.budgetMax, 6000)
  assert.equal(saved.data.status, 'Nieuw')
  assert.equal(saved.data.specialist, undefined)
  assert.equal(saved.overrideAccess, false)
  assert.equal(saved.user, user)
})

test('invalid travel wishes never reach the database and return field errors', async () => {
  const payload = {
    create() {
      throw Error('Unexpected write')
    },
  }
  const result = await actions(user, payload).createQuestionAction({
    subject: 'Wens',
    message: 'Strand',
    category: 'Reiswens',
    travellers: 21,
  })
  assert.equal(result.ok, false)
  assert.ok(result.errors.destination)
  assert.ok(result.errors.travellers)
})

test('the collection boundary also rejects forged workflow and booking fields on questions', async () => {
  const { req } = request()
  const data = await schema.protectCustomerQuestionCreate({
    operation: 'create',
    req,
    data: {
      subject: 'Advies',
      message: 'Graag advies',
      category: 'Reisadvies',
      customer: 'other',
      reference: 'forged',
      status: 'Afgesloten',
      specialist: 'forged',
      priority: 'Urgent',
      unread: false,
    },
  })
  assert.equal(data.customer, user.customer)
  assert.equal(data.status, 'Nieuw')
  assert.equal(data.priority, 'Normaal')
  assert.equal(data.unread, true)
  assert.equal(data.specialist, undefined)
  assert.notEqual(data.reference, 'forged')
})

test('direct booking stores a server-calculated price snapshot and discards injected fields', async () => {
  const { req, calls } = request()
  const data = await schema.protectCustomerBookingCreate({
    operation: 'create',
    req,
    data: record({
      status: 'Bevestigd',
      priceAdjustment: -2000,
      internalNotes: 'forged',
      currency: 'USD',
    }),
  })
  assert.equal(data.customer, user.customer)
  assert.equal(data.totalAmount, 2078)
  assert.equal(data.serviceCosts, 78)
  assert.equal(data.currency, 'EUR')
  assert.equal(data.status, 'Optie')
  assert.equal(data.lineItems[0].unitPrice, 1000)
  assert.equal(data.internalNotes, undefined)
  assert.equal(data.priceAdjustment, undefined)
  assert.equal(calls[0].overrideAccess, false)
  assert.equal(calls[0].user, user)
  assert.ok(calls.every((options) => options.req === req))
})

test('booking rejects stale prices, insufficient capacity, unpublished and expired trips', async () => {
  for (const settings of [
    { trip: { ...futureTrip, available: false } },
    { trip: { ...futureTrip, _status: 'draft' } },
    { trip: { ...futureTrip, startDate: '2000-01-01' } },
    { trip: { ...futureTrip, remainingSpots: 1 } },
    { bookings: [{ travellers: 5 }] },
  ]) {
    const { req } = request(settings)
    await assert.rejects(
      schema.protectCustomerBookingCreate({ operation: 'create', req, data: record() }),
    )
  }
  const { req } = request()
  for (const data of [
    record({ totalAmount: 1 }),
    record({ travellers: 0 }),
    record({ travellers: 1.5 }),
  ])
    await assert.rejects(schema.protectCustomerBookingCreate({ operation: 'create', req, data }))
})

test('a checkout retry returns the same booking without creating a second record', async () => {
  const result = await actions(user, {
    find: async () => ({ docs: [{ number: 'VV-existing' }] }),
  }).bookTripAction({
    tripId: futureTrip.id,
    travellers: 2,
    totalAmount: 2078,
    confirmed: true,
    requestKey: 'ad1e74aa-c27a-4f56-80bf-9212607f68d3',
  })
  assert.equal(result.ok, true)
  assert.equal(result.reference, 'VV-existing')
})

test('checkout creates an owned option and never accepts an injected workflow or price adjustment', async () => {
  let saved
  const result = await actions(user, {
    find: async () => ({ docs: [] }),
    create: async (options) => {
      saved = options
      return { number: options.data.number }
    },
  }).bookTripAction({
    tripId: futureTrip.id,
    travellers: 2,
    totalAmount: 2078,
    confirmed: true,
    requestKey: 'ad1e74aa-c27a-4f56-80bf-9212607f68d3',
    customer: 'other',
    status: 'Bevestigd',
    priceAdjustment: -2000,
  })
  assert.equal(result.ok, true)
  assert.equal(saved.data.customer, user.customer)
  assert.equal(saved.data.status, 'Optie')
  assert.equal(saved.data.priceAdjustment, undefined)
  assert.equal(saved.overrideAccess, false)
})

test('ambiguous staff email lookups cannot silently attach a question to the wrong dossier', async () => {
  let query
  const staff = { ...user, role: 'staff' }
  const result = await actions(staff, {
    find: async (options) => {
      query = options
      return { docs: [{ id: 'a' }, { id: 'b' }] }
    },
  }).createQuestionAction({ customerEmail: user.email, subject: 'Advies', message: 'Graag advies' })
  assert.equal(result.ok, false)
  assert.equal(query.limit, 2)
  assert.match(result.message, /klantprofiel/)
})

test('staff select a dossier by ID even when multiple customers share an email address', async () => {
  let query, saved
  const result = await actions(
    { ...user, role: 'staff' },
    {
      find: async (options) => {
        query = options
        return { docs: [{ id: 'correct-profile' }] }
      },
      create: async (options) => {
        saved = options
        return { reference: options.data.reference }
      },
    },
  ).createQuestionAction({
    customerId: 'correct-profile',
    customerEmail: user.email,
    subject: 'Advies',
    message: 'Graag advies',
  })
  assert.equal(result.ok, true)
  assert.equal(query.where.id.equals, 'correct-profile')
  assert.equal(saved.data.customer, 'correct-profile')
})

test('price snapshots use included/default parts and add service costs exactly once', () => {
  const result = bookingPrice(
    {
      price: 999,
      parts: [
        { key: 'stay', label: 'Verblijf', price: 400, perPerson: false, required: true },
        { key: 'flight', label: 'Vlucht', price: 200.25, perPerson: true, defaultSelected: true },
        { key: 'optional', label: 'Excursie', price: 100, defaultSelected: false },
      ],
    },
    2,
  )
  assert.equal(result.totalAmount, 878.5)
  assert.equal(result.lineItems.length, 2)
  assert.equal(result.unavailable, false)
})
