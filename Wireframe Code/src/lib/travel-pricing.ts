import { parseTravellers } from './voyage-validation'

type PricePart = {
  id: string
  price: number
  perPerson: boolean
  required: boolean
  defaultSelected: boolean
  available?: boolean
  alternatives?: { price: number; available: boolean }[]
}
type Extra = { id: string; price: number; perPerson: boolean }
type Configuration = {
  parts?: Record<string, boolean>
  alternatives?: Record<string, number>
  extras?: Extra[]
  priceAdjustment?: number
}

// Sum source prices first. Round once to cents; round only the displayed euro
// amount, never the per-person amount before multiplying by the group size.
export function calculateTravelPrice(
  travel: { parts: PricePart[] } | null,
  count: number,
  config: Configuration = {},
) {
  if (!travel || parseTravellers(count) === undefined)
    return { partsTotal: 0, extrasTotal: 0, serviceCosts: 0, totalPrice: 0 }
  const partsTotal = travel.parts.reduce((sum, part) => {
    if (!(config.parts ? config.parts[part.id] : part.required || part.defaultSelected)) return sum
    const alternative = config.alternatives
      ? part.alternatives?.[config.alternatives[part.id] ?? -1]
      : part.available === false
        ? part.alternatives?.find((item) => item.available)
        : undefined
    return sum + (alternative?.price ?? part.price) * (part.perPerson ? count : 1)
  }, 0)
  const extrasTotal = (config.extras ?? []).reduce(
    (sum, extra) => sum + extra.price * (extra.perPerson ? count : 1),
    0,
  )
  const serviceCosts = 39 * count
  return {
    partsTotal,
    extrasTotal,
    serviceCosts,
    totalPrice:
      Math.round((partsTotal + extrasTotal + serviceCosts + (config.priceAdjustment ?? 0)) * 100) /
      100,
  }
}
