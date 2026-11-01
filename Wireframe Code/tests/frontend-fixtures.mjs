// Synthetic records for rendering tests only; never imported by the app.
export const trips = [
  {
    id: 'trip-record',
    title: 'Testreis Portugal',
    destination: 'Porto',
    country: 'Portugal',
    period: '',
    startDate: '2027-06-01T00:00:00.000Z',
    endDate: '2027-06-08T00:00:00.000Z',
    nights: 7,
    price: 1195,
    maxTravellers: 6,
    available: true,
    description: 'Alleen testgegevens voor de rendercontrole.',
    image: '/qa-image.svg',
    imageAlt: 'Testillustratie',
    facilities: ['Verblijf inbegrepen'],
  },
]

export function appData(role = 'customer') {
  return {
    bookings: [],
    quotes: [],
    customers:
      role === 'customer' ? [{ name: 'Testklant', email: 'qa@voorbeeld.nl', phone: '' }] : [],
    travelWishes: {},
    destinationFeeLabels: {},
    offerExtras: [],
    initialCustomerQuestions: [],
    favoriteTravelIds: [],
    user: { name: 'Testaccount', email: 'qa@voorbeeld.nl', role },
    travelProposals: trips.map((trip) => ({
      ...trip,
      id: 'legacy-trip',
      catalogId: trip.id,
      dates: '1 – 8 juni 2027',
      startDate: trip.startDate.slice(0, 10),
      endDate: trip.endDate.slice(0, 10),
      duration: trip.nights,
      rating: 4.5,
      availabilityLabel: 'Beschikbaar',
      parts: [],
    })),
  }
}
