import {
  APIError,
  ValidationError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type CollectionSlug,
  type Field,
  type FieldAccess,
  type NumberField,
  type RelationshipField,
} from 'payload'
import { randomUUID } from 'node:crypto'
import { bookingPrice } from './booking-rules'
import { travelWishErrors } from './travel-wish'
import { parseTravellers, validDateRange } from './voyage-validation'

// Roles come from authenticated app accounts or CMS editors, never a UI toggle.
const relationshipId = (value: unknown): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return relationshipId(value.id)
  return undefined
}

export const isStaff = ({ req }: Parameters<Access>[0]) =>
  req.user?.collection === 'admins' ||
  (req.user?.collection === 'users' && req.user.role === 'staff')

export const cmsOnly = ((args) => isStaff(args)) satisfies Access
export const cmsFieldOnly: FieldAccess = ({ req }) =>
  req.user?.collection === 'admins' ||
  (req.user?.collection === 'users' && req.user.role === 'staff')
export const appUserField: FieldAccess = ({ req }) =>
  req.user?.collection === 'admins' || req.user?.collection === 'users'
export const privateAccess: NonNullable<CollectionConfig['access']> = {
  create: cmsOnly,
  read: cmsOnly,
  update: cmsOnly,
  delete: cmsOnly,
  readVersions: cmsOnly,
}
export const catalogAccess: NonNullable<CollectionConfig['access']> = {
  ...privateAccess,
  read: () => true,
}

export const customerIdForUser = (user: unknown) => {
  if (!user || typeof user !== 'object' || !('collection' in user) || user.collection !== 'users')
    return undefined
  return relationshipId('customer' in user ? user.customer : undefined)
}

export const staffOrCustomer =
  (field = 'customer'): Access =>
  (args) => {
    if (isStaff(args)) return true
    const customer = customerIdForUser(args.req.user)
    return customer === undefined ? false : { [field]: { equals: customer } }
  }

export const staffOrLinkedCustomer: Access = (args) => {
  if (isStaff(args)) return true
  const customer = customerIdForUser(args.req.user)
  return customer === undefined ? false : { id: { equals: customer } }
}

export const staffOrAppUser: Access = (args) =>
  isStaff(args) || args.req.user?.collection === 'users'

export const assignLinkedCustomer =
  (field = 'customer'): CollectionBeforeValidateHook =>
  ({ data, operation, req }) => {
    if (operation !== 'create' || req.user?.collection !== 'users' || req.user.role === 'staff')
      return data
    const customer = customerIdForUser(req.user)
    if (customer === undefined) throw new APIError('Dit account heeft nog geen klantprofiel.', 403)
    return { ...data, [field]: customer }
  }

export const protectCustomerQuoteStatus: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || req.user?.collection !== 'users' || req.user.role === 'staff')
    return data
  if (Object.keys(data).some((field) => field !== 'status'))
    throw new APIError('Klanten kunnen alleen de offertestatus wijzigen.', 403)
  if (
    !data.status ||
    (!(
      originalDoc?.status === 'Verstuurd' && ['Geaccepteerd', 'Afgewezen'].includes(data.status)
    ) &&
      data.status !== originalDoc?.status)
  )
    throw new APIError('Deze offerte kan niet naar die status worden gewijzigd.', 403)
  return data
}

export const protectCustomerQuestionCreate: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || isStaff({ req } as Parameters<Access>[0])) return data
  const customer = customerIdForUser(req.user)
  if (customer === undefined) throw new APIError('Activeer eerst je klantomgeving.', 403)
  if (
    !data.subject?.trim() ||
    data.subject.length > 200 ||
    !data.message?.trim() ||
    data.message.length > 5000 ||
    !validDateRange(data.startDate?.slice(0, 10), data.endDate?.slice(0, 10))
  )
    throw new APIError('Controleer het onderwerp, bericht en de reisdata.', 400)
  if (data.category === 'Reiswens') {
    const errors = travelWishErrors({
      ...data,
      destination: data.destinationLabel,
      period: data.periodLabel,
      departure: data.departureLabel,
      startDate: data.startDate?.slice(0, 10),
      endDate: data.endDate?.slice(0, 10),
    })
    if (Object.keys(errors).length) throw new APIError('Controleer je reiswens.', 400)
  }
  const trip = relationshipId(data.trip)
  if (trip !== undefined)
    await req.payload.findByID({
      collection: 'trips',
      id: trip,
      depth: 0,
      user: req.user,
      overrideAccess: false,
      draft: false,
      req,
    })
  const travellers = data.travellers == null ? undefined : parseTravellers(data.travellers)
  if (data.travellers != null && travellers === undefined)
    throw new APIError('Controleer het aantal reizigers.', 400)
  return {
    reference: `KV-${randomUUID()}`,
    customer,
    subject: data.subject.trim(),
    message: data.message.trim(),
    category: String(data.category || 'Reisadvies').slice(0, 200),
    channel: 'Website',
    status: 'Nieuw',
    priority: 'Normaal',
    unread: true,
    destinationLabel: data.destinationLabel,
    periodLabel: data.periodLabel,
    departureLabel: data.departureLabel,
    travellers,
    budgetLabel: data.budgetLabel,
    budgetMax: data.budgetMax,
    startDate: data.startDate,
    endDate: data.endDate,
    trip,
  }
}

export const protectCustomerBookingCreate: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || req.user?.collection !== 'users' || req.user.role === 'staff')
    return data
  const customer = customerIdForUser(req.user)
  const quoteID = relationshipId(data.quote)
  if (customer === undefined) throw new APIError('Activeer eerst je klantomgeving.', 403)
  if (!quoteID) {
    const tripID = relationshipId(data.trip)
    if (!tripID) throw new APIError('Kies een beschikbare reis.', 400)
    const trip = await req.payload.findByID({
      collection: 'trips',
      id: tripID,
      depth: 0,
      req,
      user: req.user,
      overrideAccess: false,
      draft: false,
    })
    const travellers = data.travellers
    const today = new Date().toISOString().slice(0, 10)
    if (
      trip._status !== 'published' ||
      !trip.available ||
      trip.startDate.slice(0, 10) < today ||
      !Number.isInteger(travellers) ||
      travellers < 1 ||
      travellers > trip.maxTravellers
    )
      throw new APIError('Deze reis is niet beschikbaar voor dit aantal reizigers.', 400)
    const reservations = await req.payload.find({
      collection: 'bookings',
      where: { and: [{ trip: { equals: trip.id } }, { status: { not_equals: 'Geannuleerd' } }] },
      pagination: false,
      depth: 0,
      req,
      // Trusted capacity read counts all customers without exposing their data.
      overrideAccess: true,
    })
    const reserved = reservations.docs.reduce((sum, booking) => sum + (booking.travellers ?? 1), 0)
    if (
      travellers + reserved >
      Math.min(trip.maxTravellers, trip.remainingSpots ?? trip.maxTravellers)
    )
      throw new APIError(
        'Er zijn onvoldoende plaatsen. Kies minder reizigers of een andere reis.',
        409,
      )
    const pricing = bookingPrice({ ...trip, parts: trip.parts ?? [] }, travellers)
    if (pricing.unavailable)
      throw new APIError(
        'Een inbegrepen onderdeel is niet beschikbaar. Vraag een reisvoorstel aan.',
        409,
      )
    if (data.totalAmount !== pricing.totalAmount)
      throw new APIError(
        'De reissom is gewijzigd. Open de reis opnieuw en controleer de actuele prijs.',
        409,
      )
    const key =
      typeof data.legacyId === 'string' && data.legacyId.startsWith(`checkout:${req.user.id}:`)
        ? data.legacyId
        : `checkout:${req.user.id}:${randomUUID()}`
    // Reconstruct the complete record; clients cannot inject workflow fields,
    // discounts, another customer's data or internal notes through REST either.
    return {
      legacyId: key,
      number: `VV-${key.slice(key.lastIndexOf(':') + 1)}`,
      customer,
      trip: trip.id,
      status: 'Optie',
      travellers,
      startDate: trip.startDate,
      endDate: trip.endDate,
      periodLabel:
        trip.periodLabel || `${trip.startDate.slice(0, 10)} – ${trip.endDate.slice(0, 10)}`,
      lineItems: pricing.lineItems,
      serviceCosts: pricing.serviceCosts,
      totalAmount: pricing.totalAmount,
      currency: 'EUR',
    }
  }
  const quote = await req.payload.findByID({
    collection: 'quotes',
    id: quoteID,
    depth: 0,
    overrideAccess: false,
    user: req.user,
    req,
  })
  if (quote.status !== 'Geaccepteerd' || relationshipId(quote.customer) !== customer)
    throw new APIError('Een boeking vereist een geaccepteerde eigen offerte.', 403)
  const existing = await req.payload.find({
    collection: 'bookings',
    where: { quote: { equals: quote.id } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user: req.user,
    req,
  })
  if (existing.docs.length) throw new APIError('Voor deze offerte bestaat al een boeking.', 409)
  return {
    number: `VV-${quote.number}`,
    customer,
    status: 'Optie',
    travellers: quote.travellers,
    startDate: quote.startDate,
    endDate: quote.endDate,
    trip: relationshipId(quote.trip),
    quote: quote.id,
    lineItems: quote.lineItems,
    localFees: quote.localFees,
    serviceCosts: quote.serviceCosts,
    priceAdjustment: quote.priceAdjustment,
    vatRate: quote.vatRate,
    vatAmount: quote.vatAmount,
    totalAmount: quote.totalAmount,
    currency: quote.currency,
  }
}

export const legacyId = (): Field => ({
  name: 'legacyId',
  label: 'Oorspronkelijke sleutel',
  type: 'text',
  unique: true,
  index: true,
  admin: { description: 'Stabiele importsleutel; laat Payload zelf de document-ID aanmaken.' },
})

export function money(name: string, label: string, required = false): NumberField {
  return {
    name,
    label,
    type: 'number',
    required,
    min: 0,
    validate: (value, { required: isRequired }) =>
      value == null
        ? !isRequired || 'Vul een bedrag in.'
        : (Number.isFinite(value) &&
            value >= 0 &&
            Math.abs(value * 100 - Math.round(value * 100)) < 1e-6) ||
          'Gebruik een niet-negatief bedrag met maximaal twee decimalen.',
    admin: { step: 0.01, description: 'Bedrag in euro, zonder valutasymbool.' },
  }
}

export function integer(name: string, label: string, min = 0, max?: number): NumberField {
  return {
    name,
    label,
    type: 'number',
    min,
    max,
    validate: (value, { required }) =>
      value == null
        ? !required || 'Vul een geheel getal in.'
        : (Number.isInteger(value) && value >= min && (max === undefined || value <= max)) ||
          `Gebruik een geheel getal vanaf ${min}${max === undefined ? '' : ` tot en met ${max}`}.`,
    admin: { step: 1 },
  }
}

export function relation(
  name: string,
  label: string,
  relationTo: CollectionSlug,
  required = true,
): RelationshipField {
  return { name, label, type: 'relationship', relationTo, required, index: true, maxDepth: 1 }
}

export const staffManaged = { create: cmsFieldOnly, update: cmsFieldOnly }

export function workflow(options: string[], defaultValue: string, access = staffManaged): Field {
  return {
    name: 'status',
    type: 'select',
    required: true,
    options,
    defaultValue,
    index: true,
    access,
  }
}

// Historical labels are retained because "Gisteren" or "12 jun – 27 jun"
// cannot safely be converted into an exact timestamp or year during import.
export const legacyLabels = (): Field => ({
  name: 'legacy',
  label: 'Oorspronkelijke weergave',
  type: 'group',
  fields: [
    'customer',
    'trip',
    'destination',
    'period',
    'amount',
    'received',
    'travellers',
    'budget',
  ].map((name): Field => ({ name, type: 'text' })),
})

export const travelPreferenceFields = (): Field[] => [
  { ...integer('travellers', 'Aantal reizigers', 1, 20) },
  { name: 'budgetLabel', label: 'Budget zoals opgegeven', type: 'text' },
  money('budgetMin', 'Minimaal budget'),
  money('budgetMax', 'Maximaal budget'),
  { name: 'periodLabel', label: 'Gewenste periode', type: 'text' },
  { name: 'startDate', label: 'Vertrekdatum', type: 'date' },
  { name: 'endDate', label: 'Terugkomstdatum', type: 'date' },
  relation('preferredTrip', 'Voorkeursreis', 'trips', false),
]

// Issued quotes/bookings store their own price lines. Editing the catalog must
// never silently change an agreed price or replace a selected alternative.
export const priceLineFields = (): Field[] => [
  {
    name: 'lineItems',
    label: 'Prijsregels bij vastlegging',
    type: 'array',
    fields: [
      {
        name: 'key',
        label: 'Oorspronkelijke onderdeel- of extrasleutel',
        type: 'text',
        required: true,
      },
      { name: 'label', type: 'text', required: true },
      { name: 'kind', type: 'select', options: ['part', 'extra', 'service'], required: true },
      relation('extra', 'Extra uit catalogus', 'extras', false),
      money('unitPrice', 'Eenheidsprijs', true),
      { ...integer('quantity', 'Aantal', 1), required: true, defaultValue: 1 },
      { name: 'perPerson', label: 'Per persoon', type: 'checkbox', defaultValue: false },
      integer('alternativeIndex', 'Oorspronkelijke alternatiefindex', 0),
    ],
  },
  {
    name: 'localFees',
    label: 'Lokale heffingen bij vastlegging',
    type: 'array',
    fields: [
      relation('fee', 'Heffing', 'destination-fees', false),
      { name: 'label', type: 'text', required: true },
      money('rate', 'Tarief (leeg = nog onbekend)'),
      { name: 'unit', type: 'select', options: ['perPerson', 'perPersonNight'], required: true },
      { name: 'payment', type: 'select', options: ['included', 'local'], required: true },
    ],
  },
  money('serviceCosts', 'Servicekosten'),
  {
    name: 'priceAdjustment',
    label: 'Prijsaanpassing',
    type: 'number',
    admin: { step: 0.01 },
    validate: (value: number | null | undefined) =>
      value == null ||
      (Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6) ||
      'Gebruik een bedrag met maximaal twee decimalen.',
  },
  {
    name: 'vatRate',
    label: 'BTW-percentage',
    type: 'number',
    min: 0,
    max: 30,
    admin: { step: 0.1 },
  },
  money('vatAmount', 'BTW-bedrag'),
  money('totalAmount', 'Vastgelegde reissom'),
  {
    name: 'currency',
    label: 'Valuta',
    type: 'select',
    options: ['EUR'],
    defaultValue: 'EUR',
    required: true,
  },
]

type RecordData = Record<string, unknown>
type Issue = { path: string; message: string }
export function recordIssues(data: RecordData): Issue[] {
  const issues: Issue[] = []
  const dates = (record: RecordData, prefix = '') => {
    if (
      typeof record.startDate === 'string' &&
      typeof record.endDate === 'string' &&
      Date.parse(record.endDate) < Date.parse(record.startDate)
    ) {
      issues.push({
        path: `${prefix}endDate`,
        message: 'De terugkomstdatum mag niet vóór de vertrekdatum liggen.',
      })
    }
    if (
      typeof record.budgetMin === 'number' &&
      typeof record.budgetMax === 'number' &&
      record.budgetMax < record.budgetMin
    ) {
      issues.push({
        path: `${prefix}budgetMax`,
        message: 'Het maximale budget moet minimaal het minimale budget zijn.',
      })
    }
  }
  dates(data)
  if (data.wishes && typeof data.wishes === 'object') dates(data.wishes as RecordData, 'wishes.')
  if (
    typeof data.remainingSpots === 'number' &&
    typeof data.maxTravellers === 'number' &&
    data.remainingSpots > data.maxTravellers
  ) {
    issues.push({
      path: 'remainingSpots',
      message: 'Het aantal vrije plaatsen mag niet boven de capaciteit liggen.',
    })
  }
  for (const field of ['parts', 'lineItems']) {
    if (!Array.isArray(data[field])) continue
    const keys = new Set<string>()
    data[field].forEach((row: RecordData, index: number) => {
      if (typeof row.key !== 'string') return
      if (keys.has(row.key))
        issues.push({
          path: `${field}.${index}.key`,
          message: 'Elke sleutel mag maar één keer voorkomen.',
        })
      keys.add(row.key)
    })
  }
  return issues
}

export const validateRecord: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  collection,
  req,
}) => {
  const record = { ...originalDoc, ...data }
  if (data?.wishes) record.wishes = { ...originalDoc?.wishes, ...data.wishes }
  const errors = recordIssues(record)
  if (errors.length) throw new ValidationError({ collection: collection.slug, errors, req })
  return data
}

export function protectReferences(
  references: { collection: CollectionSlug; field: string }[],
): CollectionBeforeDeleteHook {
  return async ({ req, id }) => {
    for (const reference of references) {
      const { totalDocs } = await req.payload.count({
        collection: reference.collection,
        where: { [reference.field]: { equals: id } },
        overrideAccess: false,
        user: req.user,
        req,
      })
      if (totalDocs)
        throw new APIError(
          'Dit record wordt nog gebruikt. Archiveer het of pas eerst de gekoppelde records aan.',
          409,
        )
    }
  }
}

// Check at the collection boundary too, so Admin, REST and Local API cannot
// accidentally attach one customer's booking/quote to a different customer.
export function matchRelated(
  relatedField: string,
  relatedCollection: CollectionSlug,
  matchingFields: string[],
): CollectionBeforeChangeHook {
  return async ({ data, originalDoc, collection, req }) => {
    const record = { ...originalDoc, ...data }
    const id = relationshipId(record[relatedField])
    if (id === undefined) return data
    const result: unknown = await req.payload.findByID({
      collection: relatedCollection,
      id,
      depth: 0,
      // This trusted boundary read only validates relationship consistency and
      // never exposes the related document to the caller.
      overrideAccess: true,
      req,
    })
    const related = result as RecordData
    const errors = matchingFields.flatMap((field): Issue[] => {
      const actual = relationshipId(record[field])
      const expected = relationshipId(related[field])
      return actual !== undefined && expected !== undefined && actual !== expected
        ? [
            {
              path: relatedField,
              message: `De gekoppelde ${relatedField} hoort bij een andere ${field}.`,
            },
          ]
        : []
    })
    if (errors.length) throw new ValidationError({ collection: collection.slug, errors, req })
    return data
  }
}
