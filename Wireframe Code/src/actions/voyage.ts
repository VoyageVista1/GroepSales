'use server'

import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import { randomUUID } from 'node:crypto'
import type { User } from '@/payload-types'
import { travelWishErrors } from '@/lib/travel-wish'
import {
  inputRecord,
  parseEuroAmount,
  parseTravellers,
  validEmail,
  validDateRange,
} from '@/lib/voyage-validation'

export type DataResult = {
  ok: boolean
  message: string
  reference?: string
  errors?: Record<string, string>
}
const ok = (message = 'Opgeslagen.') => ({ ok: true, message })
const fail = (message: string) => ({ ok: false, message })
const relationID = (value: unknown): User['id'] | undefined =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'id' in value
      ? relationID(value.id)
      : undefined
const amount = parseEuroAmount

class SessionExpired extends Error {}
const actionFailure = (error: unknown, booking = false): DataResult => {
  if (error instanceof SessionExpired) return fail('Je sessie is verlopen. Log opnieuw in.')
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined
  return fail(
    status === 403
      ? 'Je hebt geen toegang tot deze wijziging.'
      : booking && (status === 409 || status === 400)
        ? 'Boeken is niet gelukt: de prijs of beschikbaarheid is gewijzigd. Open de reis opnieuw of vraag een persoonlijk voorstel aan.'
        : 'Opslaan is niet gelukt. Controleer je gegevens en probeer opnieuw.',
  )
}

export async function bookTripAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (user.role !== 'customer') return fail('Log in met je klantaccount om een reis te boeken.')
    const data = inputRecord(input)
    const tripID = relationID(data.tripId)
    const travellers = parseTravellers(data.travellers)
    const requestKey = typeof data.requestKey === 'string' ? data.requestKey : ''
    if (
      !tripID ||
      !travellers ||
      data.confirmed !== true ||
      !/^[0-9a-f-]{36}$/i.test(requestKey) ||
      typeof data.totalAmount !== 'number' ||
      !Number.isFinite(data.totalAmount)
    )
      return fail('Controleer de reis, het aantal reizigers en bevestig je keuze.')
    const customer = relationID(user.customer)
    if (customer === undefined) return fail('Activeer eerst je klantomgeving om te boeken.')
    const legacyId = `checkout:${user.id}:${requestKey}`
    const existing = await payload.find({
      collection: 'bookings',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
      depth: 0,
      user,
      overrideAccess: false,
    })
    if (existing.docs[0])
      return { ...ok('Je boeking is al ontvangen.'), reference: existing.docs[0].number }
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        number: `VV-${requestKey}`,
        legacyId,
        customer,
        trip: tripID,
        travellers,
        totalAmount: data.totalAmount,
        currency: 'EUR',
        status: 'Optie',
      },
      user,
      overrideAccess: false,
      draft: false,
    })
    return {
      ...ok('Je boeking is ontvangen als optie. Je vindt deze bij Mijn reis.'),
      reference: booking.number,
    }
  } catch (error) {
    return actionFailure(error, true)
  }
}

async function context() {
  const user = await appAuth.currentUser()
  if (!user) throw new SessionExpired()
  return { user, payload: await getPayloadClient() }
}
const staff = (user: Awaited<ReturnType<typeof appAuth.currentUser>>) =>
  user?.collection === 'users' && user.role === 'staff'

export async function activateCustomerProfileAction(): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (user.role !== 'customer')
      return fail('Alleen klantaccounts kunnen een klantprofiel activeren.')
    // The collection lifecycle provisions the profile and owns the link.
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { name: user.name },
      user,
      overrideAccess: false,
    })
    return ok('Je klantomgeving is klaar. Je kunt direct boeken en reiswensen indienen.')
  } catch (error) {
    return actionFailure(error)
  }
}

export async function saveCustomerAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (!staff(user)) return fail('Alleen medewerkers kunnen klanten toevoegen.')
    const data = inputRecord(input)
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
    const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
    if (name.length < 2 || name.length > 120 || phone.length > 80 || !validEmail(email))
      return fail('Controleer de klantgegevens.')
    try {
      const customer = await payload.create({
        collection: 'customers',
        data: { name, email, phone, customerType: 'private' },
        draft: false,
        overrideAccess: false,
        user,
      })
      return { ...ok('Klant opgeslagen.'), reference: customer.id }
    } catch {
      return fail('De klant kon niet worden opgeslagen.')
    }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function saveBookingAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (!staff(user)) return fail('Alleen medewerkers kunnen boekingen wijzigen.')
    const booking = inputRecord(input)
    const number = typeof booking.id === 'string' ? booking.id : ''
    const status = typeof booking.status === 'string' ? booking.status : ''
    if (!number || !['Optie', 'Wacht op betaling', 'Bevestigd', 'Geannuleerd'].includes(status))
      return fail('Ongeldige boeking.')
    const totalAmount = amount(booking.amount)
    if (
      totalAmount === undefined ||
      number.length > 120 ||
      (typeof booking.date === 'string' && booking.date.length > 200)
    )
      return fail('Controleer het bedrag en de reisgegevens.')
    const existing = await payload.find({
      collection: 'bookings',
      where: { number: { equals: number } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
      user,
    })
    const data = {
      status: status as 'Optie' | 'Wacht op betaling' | 'Bevestigd' | 'Geannuleerd',
      periodLabel: typeof booking.date === 'string' ? booking.date : undefined,
      totalAmount,
      currency: 'EUR' as const,
    }
    if (existing.docs[0]) {
      await payload.update({
        collection: 'bookings',
        id: existing.docs[0].id,
        data,
        draft: false,
        overrideAccess: false,
        user,
      })
      return ok('Boeking bijgewerkt.')
    }
    const customerName = typeof booking.customer === 'string' ? booking.customer : ''
    const tripTitle = typeof booking.trip === 'string' ? booking.trip : ''
    const [customers, trips] = await Promise.all([
      payload.find({
        collection: 'customers',
        where:
          typeof booking.customerId === 'string'
            ? { id: { equals: booking.customerId } }
            : { name: { equals: customerName } },
        limit: 2,
        overrideAccess: false,
        user,
      }),
      payload.find({
        collection: 'trips',
        where: { title: { equals: tripTitle } },
        limit: 1,
        overrideAccess: false,
        user,
      }),
    ])
    if (customers.docs.length !== 1) return fail('Selecteer één klantprofiel voor deze boeking.')
    if (!trips.docs[0]) return fail('Reis niet gevonden.')
    await payload.create({
      collection: 'bookings',
      data: {
        number,
        customer: customers.docs[0].id,
        trip: trips.docs[0]?.id,
        ...data,
      },
      draft: false,
      overrideAccess: false,
      user,
    })
    return ok('Boeking aangemaakt.')
  } catch (error) {
    return actionFailure(error)
  }
}

export async function saveQuoteAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (!staff(user)) return fail('Alleen medewerkers kunnen offertes opslaan.')
    const quote = inputRecord(input)
    const snapshot = inputRecord(quote.snapshot)
    const quoteStatuses = [
      'Concept',
      'Verstuurd',
      'Geaccepteerd',
      'Afgewezen',
      'Verlopen',
      'Geannuleerd',
    ] as const
    const status = String(quote.status ?? 'Concept')
    if (
      !quote.number ||
      !snapshot?.customerEmail ||
      !quoteStatuses.includes(status as (typeof quoteStatuses)[number])
    )
      return fail('Offertegegevens ontbreken.')
    const totalAmount = amount(quote.amount)
    const travellers = parseTravellers(snapshot.travellers)
    if (
      typeof quote.number !== 'string' ||
      quote.number.length > 120 ||
      typeof snapshot.customerEmail !== 'string' ||
      !validEmail(snapshot.customerEmail) ||
      typeof snapshot.proposalId !== 'string' ||
      !snapshot.proposalId ||
      totalAmount === undefined ||
      travellers === undefined ||
      (snapshot.priceAdjustment !== undefined &&
        (typeof snapshot.priceAdjustment !== 'number' ||
          !Number.isFinite(snapshot.priceAdjustment) ||
          snapshot.priceAdjustment < 0)) ||
      (snapshot.vatRate !== undefined &&
        (typeof snapshot.vatRate !== 'number' ||
          !Number.isFinite(snapshot.vatRate) ||
          snapshot.vatRate < 0 ||
          snapshot.vatRate > 100))
    )
      return fail('Controleer de offerte, het aantal reizigers en de bedragen.')
    const [customers, trips, existing] = await Promise.all([
      payload.find({
        collection: 'customers',
        where:
          typeof snapshot.customerId === 'string'
            ? { id: { equals: snapshot.customerId } }
            : { email: { equals: String(snapshot.customerEmail).toLowerCase() } },
        limit: 2,
        overrideAccess: false,
        user,
      }),
      payload.find({
        collection: 'trips',
        where: {
          or: [
            { legacyId: { equals: snapshot.proposalId } },
            { id: { equals: snapshot.proposalId } },
          ],
        },
        limit: 1,
        overrideAccess: false,
        user,
      }),
      payload.find({
        collection: 'quotes',
        where: { number: { equals: String(quote.number) } },
        limit: 1,
        overrideAccess: false,
        user,
      }),
    ])
    if (customers.docs.length !== 1) return fail('Selecteer één klantprofiel voor deze offerte.')
    if (!trips.docs[0]) return fail('Reis niet gevonden.')
    const data = {
      number: String(quote.number),
      customer: customers.docs[0].id,
      trip: trips.docs[0]?.id,
      status: status as (typeof quoteStatuses)[number],
      customerType:
        snapshot.customerType === 'business' ? ('business' as const) : ('private' as const),
      travellers,
      budgetLabel: String(snapshot.budget ?? ''),
      priceAdjustment: Number(snapshot.priceAdjustment) || 0,
      totalAmount,
      currency: 'EUR' as const,
      legacySnapshot: {
        customerId: customers.docs[0].id,
        customerEmail: customers.docs[0].email,
        customerType: snapshot.customerType === 'business' ? 'business' : 'private',
        travellers: String(travellers),
        budget: typeof snapshot.budget === 'string' ? snapshot.budget.slice(0, 200) : '',
        proposalId: snapshot.proposalId,
        parts: Object.fromEntries(
          Object.entries(inputRecord(snapshot.parts)).filter(
            ([key, value]) => key.length <= 120 && typeof value === 'boolean',
          ),
        ),
        alternatives: Object.fromEntries(
          Object.entries(inputRecord(snapshot.alternatives)).filter(
            ([key, value]) =>
              key.length <= 120 &&
              typeof value === 'number' &&
              Number.isInteger(value) &&
              value >= -1 &&
              value < 100,
          ),
        ),
        extras: Object.fromEntries(
          Object.entries(inputRecord(snapshot.extras)).filter(
            ([key, value]) => key.length <= 120 && typeof value === 'boolean',
          ),
        ),
        priceAdjustment: snapshot.priceAdjustment ?? 0,
        vatRate: snapshot.vatRate ?? 21,
        localFeeRates: Object.fromEntries(
          Object.entries(inputRecord(snapshot.localFeeRates)).filter(
            ([key, value]) =>
              key.length <= 120 && typeof value === 'string' && /^\d+(?:[.,]\d{1,2})?$/.test(value),
          ),
        ),
        personalMessage:
          typeof snapshot.personalMessage === 'string'
            ? snapshot.personalMessage.slice(0, 5000)
            : '',
      },
    }
    if (existing.docs[0]) {
      await payload.update({
        collection: 'quotes',
        id: existing.docs[0].id,
        data,
        draft: false,
        overrideAccess: false,
        user,
      })
    } else {
      await payload.create({
        collection: 'quotes',
        data,
        draft: false,
        overrideAccess: false,
        user,
      })
    }
    return ok('Offerte opgeslagen.')
  } catch (error) {
    return actionFailure(error)
  }
}

export async function updateQuestionAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    if (!staff(user)) return fail('Alleen medewerkers kunnen klantvragen wijzigen.')
    const data = inputRecord(input)
    const reference = typeof data.id === 'string' ? data.id : ''
    const existing = await payload.find({
      collection: 'customer-questions',
      where: { reference: { equals: reference } },
      limit: 1,
      overrideAccess: false,
      user,
    })
    if (!existing.docs[0]) return fail('Klantvraag niet gevonden.')
    const update: Record<string, unknown> = {}
    if (
      typeof data.status === 'string' &&
      ['Nieuw', 'In behandeling', 'Doorgestuurd', 'Beantwoord', 'Afgesloten'].includes(data.status)
    )
      update.status = data.status
    if (typeof data.unread === 'boolean') update.unread = data.unread
    if (typeof data.specialist === 'string') update.specialist = data.specialist.slice(0, 120)
    await payload.update({
      collection: 'customer-questions',
      id: existing.docs[0].id,
      data: update,
      draft: false,
      overrideAccess: false,
      user,
    })
    return ok()
  } catch (error) {
    return actionFailure(error)
  }
}

export async function addQuestionMessageAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    const data = inputRecord(input)
    const reference = typeof data.questionId === 'string' ? data.questionId : ''
    const body = typeof data.body === 'string' ? data.body.trim().slice(0, 5000) : ''
    const kind = data.kind === 'internalNote' ? 'internalNote' : 'staffReply'
    if (data.kind !== 'internalNote' && data.kind !== 'staffReply')
      return fail('Ongeldig berichttype.')
    if (!staff(user) || !reference || !body) return fail('Bericht kon niet worden opgeslagen.')
    const question = await payload.find({
      collection: 'customer-questions',
      where: { reference: { equals: reference } },
      limit: 1,
      overrideAccess: false,
      user,
    })
    if (!question.docs[0]) return fail('Klantvraag niet gevonden.')
    await payload.create({
      collection: 'messages',
      data: {
        question: question.docs[0].id,
        kind,
        body,
        authorName: user.name,
        deliveryStatus: kind === 'internalNote' ? 'imported' : 'sent',
      },
      draft: false,
      overrideAccess: false,
      user,
    })
    if (kind === 'staffReply')
      await payload.update({
        collection: 'customer-questions',
        id: question.docs[0].id,
        data: { status: 'Beantwoord', unread: false },
        draft: false,
        overrideAccess: false,
        user,
      })
    return ok(kind === 'internalNote' ? 'Notitie opgeslagen.' : 'Antwoord opgeslagen.')
  } catch (error) {
    return actionFailure(error)
  }
}

export async function createQuestionAction(input: unknown): Promise<DataResult> {
  try {
    const { user, payload } = await context()
    const data = inputRecord(input)
    const subject = typeof data.subject === 'string' ? data.subject.trim().slice(0, 200) : ''
    const message = typeof data.message === 'string' ? data.message.trim().slice(0, 5000) : ''
    if (
      !subject ||
      !message ||
      (typeof data.subject === 'string' && data.subject.length > 200) ||
      (typeof data.message === 'string' && data.message.length > 5000)
    )
      return fail('Vul een onderwerp (maximaal 200 tekens) en bericht (maximaal 5000 tekens) in.')
    if (data.category === 'Reiswens') {
      const errors = travelWishErrors(data)
      if (Object.keys(errors).length) return { ...fail('Controleer je reiswens.'), errors }
    }
    for (const key of ['category', 'destination', 'period', 'budget', 'departure']) {
      if (data[key] !== undefined && (typeof data[key] !== 'string' || data[key].length > 200))
        return fail('Gebruik maximaal 200 tekens per reisvoorkeur.')
    }
    if (!validDateRange(data.startDate, data.endDate)) return fail('Controleer de reisdata.')
    const travellers = parseTravellers(data.travellers)
    if (data.travellers && data.travellers !== 'Onbekend' && travellers === undefined)
      return fail('Gebruik een aantal reizigers van 1 tot 20.')
    let customer: User['id'] | undefined
    if (
      staff(user) &&
      (typeof data.customerId === 'string' || typeof data.customerEmail === 'string')
    ) {
      const result = await payload.find({
        collection: 'customers',
        where:
          typeof data.customerId === 'string'
            ? { id: { equals: data.customerId } }
            : { email: { equals: String(data.customerEmail).toLowerCase() } },
        limit: 2,
        overrideAccess: false,
        user,
      })
      if (result.docs.length !== 1)
        return fail(
          'Selecteer één klantprofiel; meerdere profielen kunnen hetzelfde e-mailadres hebben.',
        )
      customer = result.docs[0]?.id
    } else {
      customer = relationID(user.customer)
    }
    if (customer === undefined)
      return fail('Activeer eerst je klantomgeving om een aanvraag te versturen.')
    let trip: User['id'] | undefined
    if (typeof data.travelId === 'string' && data.travelId) {
      const trips = await payload.find({
        collection: 'trips',
        where: { or: [{ id: { equals: data.travelId } }, { legacyId: { equals: data.travelId } }] },
        limit: 1,
        user,
        overrideAccess: false,
        draft: false,
      })
      trip = trips.docs[0]?.id
      if (!trip)
        return fail('Deze reis bestaat niet meer. Kies een andere reis of dien een reiswens in.')
    }
    const reference = `KV-${randomUUID()}`
    const question = await payload.create({
      collection: 'customer-questions',
      data: {
        reference,
        customer,
        subject,
        message,
        category: typeof data.category === 'string' ? data.category : 'Reisadvies',
        channel: staff(user) ? 'Handmatig' : 'Website',
        priority: 'Normaal',
        status: 'Nieuw',
        destinationLabel: typeof data.destination === 'string' ? data.destination : undefined,
        periodLabel: typeof data.period === 'string' ? data.period : undefined,
        travellers,
        budgetLabel: typeof data.budget === 'string' ? data.budget : undefined,
        startDate: typeof data.startDate === 'string' ? data.startDate : undefined,
        endDate: typeof data.endDate === 'string' ? data.endDate : undefined,
        budgetMax: typeof data.budgetMax === 'number' ? data.budgetMax : undefined,
        departureLabel: typeof data.departure === 'string' ? data.departure : undefined,
        trip,
      },
      draft: false,
      overrideAccess: false,
      user,
    })
    return {
      ...ok(data.category === 'Reiswens' ? 'Je reiswens is verstuurd.' : 'Klantvraag opgeslagen.'),
      reference: question.reference,
    }
  } catch (error) {
    return actionFailure(error)
  }
}

export async function toggleFavoriteAction(travelLegacyId: string): Promise<DataResult> {
  try {
    if (typeof travelLegacyId !== 'string' || !travelLegacyId || travelLegacyId.length > 120)
      return fail('Ongeldige reis.')
    const { user, payload } = await context()
    if (user.role !== 'customer') return fail('Favorieten zijn gekoppeld aan klantaccounts.')
    const customer = relationID(user.customer)
    if (customer === undefined) return fail('Je account heeft nog geen gekoppeld klantprofiel.')
    const trips = await payload.find({
      collection: 'trips',
      where: { or: [{ legacyId: { equals: travelLegacyId } }, { id: { equals: travelLegacyId } }] },
      limit: 1,
      overrideAccess: false,
      user,
    })
    if (!trips.docs[0]) return fail('Reis niet gevonden.')
    const existing = await payload.find({
      collection: 'favorites',
      where: {
        and: [{ customer: { equals: customer } }, { trip: { equals: trips.docs[0].id } }],
      },
      limit: 1,
      overrideAccess: false,
      user,
    })
    if (existing.docs[0]) {
      await payload.delete({
        collection: 'favorites',
        id: existing.docs[0].id,
        overrideAccess: false,
        user,
      })
      return ok('Favoriet verwijderd.')
    }
    await payload.create({
      collection: 'favorites',
      data: { customer, trip: trips.docs[0].id },
      draft: false,
      overrideAccess: false,
      user,
    })
    return ok('Favoriet opgeslagen.')
  } catch (error) {
    return actionFailure(error)
  }
}

export async function acceptQuoteAction(number: string): Promise<DataResult> {
  try {
    if (typeof number !== 'string' || !number || number.length > 120)
      return fail('Ongeldige offerte.')
    const { user, payload } = await context()
    if (user.role !== 'customer') return fail('Alleen klanten kunnen een offerte accepteren.')
    const customer = relationID(user.customer)
    if (customer === undefined) return fail('Je account heeft nog geen gekoppeld klantprofiel.')
    const result = await payload.find({
      collection: 'quotes',
      where: { number: { equals: number } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
      user,
    })
    const quote = result.docs[0]
    if (!quote) return fail('Offerte niet gevonden.')
    if (!['Verstuurd', 'Geaccepteerd'].includes(quote.status))
      return fail('Deze offerte kan niet worden geaccepteerd.')
    if (quote.status !== 'Geaccepteerd')
      await payload.update({
        collection: 'quotes',
        id: quote.id,
        data: { status: 'Geaccepteerd' },
        draft: false,
        overrideAccess: false,
        user,
      })
    const existing = await payload.find({
      collection: 'bookings',
      where: { quote: { equals: quote.id } },
      limit: 1,
      overrideAccess: false,
      user,
    })
    if (!existing.docs[0]) {
      await payload.create({
        collection: 'bookings',
        data: {
          number: `VV-${quote.number}`,
          customer,
          quote: quote.id,
          trip: relationID(quote.trip),
          totalAmount: quote.totalAmount,
          currency: 'EUR',
          status: 'Optie',
        },
        draft: false,
        overrideAccess: false,
        user,
      })
    }
    return ok('Offerte geaccepteerd en boeking aangemaakt.')
  } catch (error) {
    return actionFailure(error)
  }
}
