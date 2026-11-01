export const inputRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

export const validEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)

// The UI displays Dutch euro amounts. Reject malformed or negative amounts;
// stripping arbitrary characters could silently turn an invalid input into a charge.
export function parseEuroAmount(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().replace(/^€\s*/, '')
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(normalized)) return undefined
  const amount = Number(normalized.replaceAll('.', '').replace(',', '.'))
  return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000_000 ? amount : undefined
}

export function parseTravellers(value: unknown): number | undefined {
  const raw =
    typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : ''
  if (!/^\d+(?: personen| reizigers)?$/.test(raw)) return undefined
  const count = Number(raw.split(' ')[0])
  return Number.isInteger(count) && count >= 1 && count <= 20 ? count : undefined
}

export function validDateRange(start: unknown, end: unknown): boolean {
  const validDate = (value: unknown) =>
    value === undefined ||
    value === '' ||
    (typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value)
  return validDate(start) && validDate(end) && (!start || !end || String(start) <= String(end))
}
