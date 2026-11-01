// Shared price contract for the checkout preview and the collection boundary.
// Prices are copied into the booking so later catalogue edits cannot change it.
import { calculateTravelPrice } from './travel-pricing'
type Package = {
  price: number
  parts: {
    id?: string | null
    key?: string
    label: string
    price: number
    perPerson?: boolean | null
    required?: boolean | null
    defaultSelected?: boolean | null
    available?: boolean | null
  }[]
}
export function bookingPrice(trip: Package, travellers: number) {
  const selected = trip.parts.filter((part) => part.required || part.defaultSelected)
  const lineItems = selected.length
    ? selected.map((part) => ({
        key: part.key ?? part.id ?? part.label,
        label: part.label,
        kind: 'part' as const,
        unitPrice: part.price,
        quantity: part.perPerson === false ? 1 : travellers,
        perPerson: part.perPerson !== false,
      }))
    : [
        {
          key: 'package',
          label: 'Reispakket',
          kind: 'part' as const,
          unitPrice: trip.price,
          quantity: travellers,
          perPerson: true,
        },
      ]
  const { serviceCosts, totalPrice: totalAmount } = calculateTravelPrice(
    {
      parts: lineItems.map((line) => ({
        id: line.key,
        price: line.unitPrice,
        perPerson: line.perPerson,
        required: true,
        defaultSelected: true,
      })),
    },
    travellers,
  )
  return {
    lineItems,
    serviceCosts,
    totalAmount,
    unavailable: selected.some((part) => part.available === false),
  }
}
