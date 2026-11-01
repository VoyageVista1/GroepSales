import 'server-only'

import { unstable_cache } from 'next/cache'
import type { User } from '@/payload-types'
import type { VoyageVistaData } from '@/types/voyage'
import { VOYAGE_CATALOG_TAG } from './voyage-cache'
import { getPayloadClient } from './payload'

type RecordLike = Record<string, any>
const record = (value: unknown): RecordLike | null =>
  value && typeof value === 'object' ? (value as RecordLike) : null
const id = (value: unknown) => record(value)?.id ?? value
const euro = (value: unknown) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(typeof value === 'number' ? value : 0)
const dateOnly = (value: unknown) => (typeof value === 'string' ? value.slice(0, 10) : '')

const loadPublicCatalog = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const options = { overrideAccess: false as const, limit: 100, depth: 2 }
    const [tripsResult, extrasResult, feesResult] = await Promise.all([
      payload.find({ collection: 'trips', ...options, draft: false }),
      payload.find({ collection: 'extras', ...options }),
      payload.find({ collection: 'destination-fees', ...options }),
    ])
    return {
      trips: tripsResult.docs,
      extras: extrasResult.docs,
      fees: feesResult.docs,
    }
  },
  ['voyage-public-catalog'],
  { tags: [VOYAGE_CATALOG_TAG] },
)

export async function loadVoyageVistaData(user: User): Promise<VoyageVistaData | null> {
  const customerId = typeof user.customer === 'string' ? user.customer : user.customer?.id
  // An unlinked customer has no right to private records. Avoid the queries
  // rather than catching their Forbidden errors after they have already run.
  if (user.role === 'customer' && !customerId) return null
  const payload = await getPayloadClient()
  const options = { overrideAccess: false as const, user, limit: 100, depth: 2 }
  const [
    publicCatalog,
    customersResult,
    bookingsResult,
    quotesResult,
    questionsResult,
    messagesResult,
    favoritesResult,
  ] = await Promise.all([
    loadPublicCatalog(),
    payload.find({ collection: 'customers', ...options }),
    payload.find({ collection: 'bookings', ...options }),
    payload.find({ collection: 'quotes', ...options }),
    payload.find({ collection: 'customer-questions', ...options }),
    payload.find({ collection: 'messages', ...options }),
    payload.find({ collection: 'favorites', ...options }),
  ])
  const { trips: tripDocs, extras: extraDocs, fees: feeDocs } = publicCatalog

  const trips = tripDocs.map((trip) => {
    const destination = record(trip.destination)
    const image = record(trip.image)
    return {
      id: trip.legacyId ?? String(trip.id),
      catalogId: trip.id,
      title: trip.title,
      destination: destination?.name ?? '',
      country: destination?.country ?? '',
      dates: trip.periodLabel ?? '',
      startDate: dateOnly(trip.startDate),
      endDate: dateOnly(trip.endDate),
      duration: trip.duration,
      price: trip.price,
      rating: trip.rating ?? 0,
      maxTravellers: trip.maxTravellers,
      remainingSpots: trip.remainingSpots ?? undefined,
      available: trip.available ?? false,
      availabilityLabel: trip.availabilityLabel ?? '',
      description: trip.description,
      image: image?.url,
      facilities: (trip.facilities ?? []).map((item) => item.label),
      parts: (trip.parts ?? []).map((part) => ({
        id: part.key,
        label: part.label,
        price: part.price,
        perPerson: part.perPerson ?? true,
        required: part.required ?? false,
        defaultSelected: part.defaultSelected ?? false,
        available: part.available ?? true,
        alternatives: (part.alternatives ?? []).map((alternative) => ({
          label: alternative.label,
          price: alternative.price,
          available: alternative.available ?? true,
        })),
      })),
    }
  })
  const tripByID = new Map(tripDocs.map((trip, index) => [String(trip.id), trips[index]]))

  const customers = customersResult.docs.map((customer) => ({
    id: customer.id,
    accountProfile: customer.legacyId?.startsWith('app-account:') ?? false,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? '',
    customerType: customer.customerType ?? 'private',
  }))
  const customerByID = new Map(
    customersResult.docs.map((customer, index) => [String(customer.id), customers[index]]),
  )

  const travelWishes = Object.fromEntries(
    customersResult.docs.map((customer) => {
      const preferred = tripByID.get(String(id(customer.wishes?.preferredTrip)))
      return [
        customer.id,
        {
          travellers: customer.wishes?.travellers ?? 2,
          budget: customer.wishes?.budgetLabel ?? '',
          proposalId: preferred?.id ?? '',
        },
      ]
    }),
  )

  const bookings = bookingsResult.docs.map((booking) => ({
    id: booking.number,
    customerId: String(id(booking.customer)),
    customer:
      customerByID.get(String(id(booking.customer)))?.name ?? booking.legacy?.customer ?? '',
    trip: tripByID.get(String(id(booking.trip)))?.title ?? booking.legacy?.trip ?? '',
    date: booking.periodLabel ?? booking.legacy?.period ?? '',
    amount: booking.legacy?.amount ?? euro(booking.totalAmount),
    status: booking.status,
  }))
  const bookingByID = new Map(
    bookingsResult.docs.map((booking, index) => [String(booking.id), bookings[index]]),
  )

  const quotes = quotesResult.docs.map((quote) => {
    const trip = tripByID.get(String(id(quote.trip)))
    return {
      number: quote.number,
      customerId: String(id(quote.customer)),
      customer: customerByID.get(String(id(quote.customer)))?.name ?? quote.legacy?.customer ?? '',
      destination: quote.legacy?.destination ?? trip?.destination ?? '',
      amount: quote.legacy?.amount ?? euro(quote.totalAmount),
      time: quote.legacy?.received ?? '',
      status: quote.status,
      snapshot: (quote.legacySnapshot ?? undefined) as any,
    }
  })

  const messagesByQuestion = new Map<string, RecordLike[]>()
  for (const message of messagesResult.docs) {
    const key = String(id(message.question))
    messagesByQuestion.set(key, [...(messagesByQuestion.get(key) ?? []), message])
  }
  const initialCustomerQuestions = questionsResult.docs.map((question) => {
    const customer = customerByID.get(String(id(question.customer)))
    const relatedMessages = messagesByQuestion.get(String(question.id)) ?? []
    return {
      id: question.reference,
      customerId: String(id(question.customer)),
      customerEmail: customer?.email ?? '',
      subject: question.subject,
      category: question.category,
      channel: question.channel,
      priority: question.priority ?? 'Normaal',
      status: question.status ?? 'Nieuw',
      received:
        question.legacy?.received ??
        new Intl.DateTimeFormat('nl-NL', {
          dateStyle: 'medium',
          timeZone: 'Europe/Amsterdam',
        }).format(new Date(question.createdAt)),
      unread: question.unread ?? false,
      message: question.message,
      bookingId: bookingByID.get(String(id(question.booking)))?.id,
      specialist: question.specialist ?? undefined,
      destination: question.destinationLabel ?? question.legacy?.destination ?? '',
      period: question.periodLabel ?? question.legacy?.period ?? '',
      travellers: question.legacy?.travellers ?? String(question.travellers ?? ''),
      budget: question.budgetLabel ?? question.legacy?.budget ?? '',
      departure: question.departureLabel ?? undefined,
      travelId: tripByID.get(String(id(question.trip)))?.id,
      startDate: dateOnly(question.startDate) || undefined,
      endDate: dateOnly(question.endDate) || undefined,
      lastReply: [...relatedMessages].reverse().find((message) => message.kind === 'staffReply')
        ?.body,
      notes: (user.role === 'staff' ? relatedMessages : [])
        .filter((message) => message.kind === 'internalNote')
        .map((message) => String(message.body)),
    }
  })

  const destinationFeeLabels = Object.fromEntries(
    feeDocs.map((fee) => [
      fee.country,
      {
        label: fee.label,
        description: fee.description ?? '',
        unit: fee.unit,
        payment: fee.payment ?? 'local',
      },
    ]),
  )

  return {
    bookings,
    quotes,
    customers,
    travelWishes,
    travelProposals: trips,
    destinationFeeLabels,
    offerExtras: extraDocs.map((extra) => ({
      id: extra.legacyId ?? String(extra.id),
      label: extra.label,
      price: extra.price,
      perPerson: extra.perPerson ?? true,
      available: extra.available ?? true,
    })),
    initialCustomerQuestions,
    favoriteTravelIds: favoritesResult.docs
      .map((favorite) => tripByID.get(String(id(favorite.trip)))?.id)
      .filter((value): value is string => Boolean(value)),
    user: { name: user.name, email: user.email, role: user.role },
  }
}
