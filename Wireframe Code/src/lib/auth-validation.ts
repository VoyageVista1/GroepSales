export type AuthField = 'name' | 'email' | 'password' | 'confirmPassword'
export type AuthResult = {
  ok: boolean
  message: string
  errors?: Partial<Record<AuthField, string>>
  accountCreated?: boolean
  reason?: LoginFailureReason
}

export const loginMessages = {
  invalid: 'Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.',
  'rate-limit': 'Te veel inlogpogingen. Probeer het later opnieuw.',
  unavailable: 'Inloggen is tijdelijk niet beschikbaar. Probeer het opnieuw.',
  'form-invalid': 'Controleer je e-mailadres en vul je wachtwoord in.',
  origin:
    'Deze inlogaanvraag kon niet veilig worden verwerkt. Open het inlogscherm opnieuw en probeer nogmaals.',
  session:
    'Je aanmelding kon na het inloggen niet worden teruggelezen. Je blijft op dit scherm. Je kunt opnieuw proberen.',
  response: 'De preview geeft geen geldig antwoord op de inlogaanvraag. Je bent niet doorgestuurd.',
  network: 'De verbinding tussen de preview en de inlogserver is onderbroken. Probeer opnieuw.',
  timeout: 'Inloggen duurt te lang. Probeer het opnieuw.',
} as const
export type LoginFailureReason = keyof typeof loginMessages

export function loginFailure(error: unknown): AuthResult & { reason: LoginFailureReason } {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : null
  const reason =
    status === 429
      ? 'rate-limit'
      : status === 400 || status === 401 || status === 403
        ? 'invalid'
        : 'unavailable'
  return { ok: false, reason, message: loginMessages[reason] }
}

const text = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '')
const passwordValue = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : '')

export function validateCredentials(formData: FormData, register = false) {
  const name = text(formData.get('name'))
  const email = text(formData.get('email')).toLowerCase()
  // Spaces can be part of a password. Never trim or normalize it.
  const password = passwordValue(formData.get('password'))
  const errors: NonNullable<AuthResult['errors']> = {}

  if (register && (name.length < 2 || name.length > 120))
    errors.name = 'Vul je naam in (2 tot 120 tekens).'
  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))
    errors.email = 'Vul een geldig e-mailadres in.'
  if (!password || password.length > 128)
    errors.password = 'Vul je wachtwoord in (maximaal 128 tekens).'
  else if (register && password.length < 8)
    errors.password = 'Gebruik een wachtwoord van minimaal 8 tekens.'
  if (register && passwordValue(formData.get('confirmPassword')) !== password)
    errors.confirmPassword = 'De wachtwoorden komen niet overeen.'

  return { name, email, password, errors, valid: Object.keys(errors).length === 0 }
}
