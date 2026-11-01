import { inputRecord, parseTravellers, validDateRange } from './voyage-validation'

export function travelWishErrors(input: unknown): Record<string, string> {
  const data = inputRecord(input)
  const errors: Record<string, string> = {}
  for (const [key, max] of [
    ['destination', 200],
    ['period', 200],
    ['message', 5000],
  ] as const) {
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > max)
      errors[key] =
        `Vul ${key === 'destination' ? 'een bestemming of ‘Nog te bepalen’' : key === 'period' ? 'je gewenste periode of flexibiliteit' : 'je reisvoorkeuren'} in (maximaal ${max} tekens).`
  }
  if (!parseTravellers(data.travellers))
    errors.travellers = 'Vul een geheel aantal reizigers in van 1 tot en met 20.'
  if (
    !validDateRange(data.startDate, data.endDate) ||
    Boolean(data.startDate) !== Boolean(data.endDate)
  )
    errors.endDate =
      'Vul beide reisdata in en kies een terugkomstdatum op of na vertrek, of laat beide leeg.'
  if (data.startDate && String(data.startDate) < new Date().toISOString().slice(0, 10))
    errors.startDate = 'Kies een vertrekdatum vanaf vandaag.'
  if (
    data.budgetMax !== undefined &&
    data.budgetMax !== '' &&
    (typeof data.budgetMax !== 'number' ||
      !Number.isFinite(data.budgetMax) ||
      data.budgetMax < 0 ||
      data.budgetMax > 1_000_000_000 ||
      Math.abs(data.budgetMax * 100 - Math.round(data.budgetMax * 100)) > 1e-6)
  )
    errors.budgetMax = 'Vul een geldig totaalbudget in euro in, met maximaal twee decimalen.'
  if (
    data.departure !== undefined &&
    (typeof data.departure !== 'string' || data.departure.length > 200)
  )
    errors.departure = 'Gebruik maximaal 200 tekens voor de vertrekvoorkeur.'
  return errors
}
