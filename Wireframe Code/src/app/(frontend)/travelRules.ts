export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim())

export function travellerError(value: string | number) {
  const count = Number(value)
  return String(value).trim() && Number.isInteger(count) && count >= 1 && count <= 20
    ? ''
    : 'Vul een geheel aantal reizigers in van 1 tot en met 20.'
}

type Capacity = { available: boolean; maxTravellers: number; remainingSpots?: number }
export function travelCapacityError(travel: Capacity | null, count: string | number) {
  const invalidCount = travellerError(count)
  if (invalidCount) return invalidCount
  if (!travel) return 'Kies eerst een reis.'
  if (!travel.available) return 'Deze reis is niet beschikbaar. Kies een andere reis.'
  const capacity = Math.min(travel.maxTravellers, travel.remainingSpots ?? travel.maxTravellers)
  return Number(count) > capacity
    ? `Er zijn maximaal ${capacity} plaatsen beschikbaar voor ${count} reizigers. Verlaag het aantal reizigers of kies een andere reis.`
    : ''
}

export function decimalRateError(value: string, kind: 'vat' | 'local') {
  if (kind === 'local' && value.trim() === '') return ''
  const number = Number(value)
  const validStep = Math.abs(number * 10 - Math.round(number * 10)) < 1e-8
  return value.trim() &&
    Number.isFinite(number) &&
    number >= 0 &&
    (kind === 'local' || number <= 30) &&
    validStep
    ? ''
    : kind === 'vat'
      ? 'Vul een BTW-percentage van 0 tot en met 30 in, in stappen van 0,1.'
      : 'Vul een niet-negatieve lokale heffing in, in stappen van 0,1. Of laat het tarief leeg als het nog onbekend is.'
}

export function dateOrderError(departure: string, returnDate: string) {
  return departure && returnDate && returnDate < departure
    ? 'De terugkomstdatum mag niet vóór de vertrekdatum liggen.'
    : ''
}

export { calculateTravelPrice } from '@/lib/travel-pricing'
