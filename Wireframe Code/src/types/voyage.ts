export type Booking = {
  id: string
  customerId?: string
  customer: string
  trip: string
  date: string
  amount: string
  status: string
}

export type QuoteSnapshot = {
  customerId?: string
  customerEmail: string
  customerType?: CustomerType
  travellers: string
  budget: string
  proposalId: string
  parts: Record<string, boolean>
  alternatives: Record<string, number>
  extras: Record<string, boolean>
  priceAdjustment: number
  vatRate?: number
  localFeeRates?: Record<string, string>
  personalMessage?: string
}

export type QuoteItem = {
  customerId?: string
  customer: string
  destination: string
  amount: string
  time: string
  status: string
  number: string
  snapshot?: QuoteSnapshot
}

export type Customer = {
  id?: string
  accountProfile?: boolean
  name: string
  email: string
  phone: string
  customerType?: CustomerType
}

export type CustomerType = 'private' | 'business'

export type TravelPart = {
  id: string
  label: string
  price: number
  perPerson: boolean
  required: boolean
  defaultSelected: boolean
  available?: boolean
  alternatives?: { label: string; price: number; available: boolean }[]
}

export type Travel = {
  id: string
  catalogId: import('@/payload-types').Trip['id']
  title: string
  destination: string
  country: string
  dates: string
  startDate: string
  endDate: string
  duration: number
  price: number
  rating: number
  maxTravellers: number
  remainingSpots?: number
  available: boolean
  availabilityLabel: string
  description: string
  facilities: string[]
  parts: TravelPart[]
  image?: string
}

export type TravelSelection = {
  customerId?: string
  travelId: string
  travellers: number
  departure: string
  returnDate: string
  customerEmail?: string
  budget?: string
}

export type DestinationFee = {
  id: string
  label: string
  description: string
  unit: 'perPerson' | 'perPersonNight'
  payment: 'included' | 'local'
}

export type OfferExtra = {
  id: string
  label: string
  price: number
  perPerson: boolean
  available: boolean
}

export type CustomerQuestionStatus =
  | 'Nieuw'
  | 'In behandeling'
  | 'Doorgestuurd'
  | 'Beantwoord'
  | 'Afgesloten'

export type CustomerQuestion = {
  id: string
  customerId?: string
  customerEmail: string
  subject: string
  category: string
  channel: string
  priority: 'Normaal' | 'Hoog' | 'Urgent'
  status: CustomerQuestionStatus
  received: string
  unread: boolean
  message: string
  bookingId?: string
  specialist?: string
  destination: string
  period: string
  travellers: string
  budget: string
  departure?: string
  travelId?: string
  startDate?: string
  endDate?: string
  lastReply?: string
  notes: string[]
}

export type VoyageVistaData = {
  bookings: Booking[]
  quotes: QuoteItem[]
  customers: Customer[]
  travelWishes: Record<string, { travellers: number; budget: string; proposalId: string }>
  travelProposals: Travel[]
  destinationFeeLabels: Record<string, Omit<DestinationFee, 'id'>>
  offerExtras: OfferExtra[]
  initialCustomerQuestions: CustomerQuestion[]
  favoriteTravelIds: string[]
  user: { name: string; email: string; role: 'staff' | 'customer' }
}
