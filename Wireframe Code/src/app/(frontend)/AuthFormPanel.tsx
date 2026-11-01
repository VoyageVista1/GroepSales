'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerAction } from '@/actions/auth'
import { loginWithBrowserSession } from '@/lib/browser-login'
import type { AuthField, AuthResult } from '@/lib/auth-validation'
import ErrorBoundary from './ErrorBoundary'

const initial: AuthResult = { ok: false, message: '' }
const inputClass =
  'mt-2! block! w-full! rounded-lg! border! border-[var(--vv-border)]! bg-white! px-4! py-3.5! text-base! text-[var(--vv-text)]! outline-none! transition! placeholder:text-[var(--vv-muted)]! focus:border-[var(--vv-primary)]! focus:ring-2! focus:ring-[var(--vv-mint)]! disabled:opacity-60!'

function AuthForm({
  mode,
  onLogin,
  onBusyChange,
}: {
  mode: 'login' | 'register'
  onLogin: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const register = mode === 'register'
  const [registrationState, action, pending] = useActionState(registerAction, initial, '/inloggen')
  const [loginState, setLoginState] = useState<AuthResult>(initial)
  const state = register ? registrationState : loginState
  const [posting, setPosting] = useState(false)
  const inFlight = useRef(false)
  const router = useRouter()
  useEffect(() => {
    const reset = () => setPosting(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState<Record<AuthField, string>>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const form = useRef<HTMLFormElement>(null)
  const errors = state.errors ?? {}
  const busy = pending || posting
  useEffect(() => onBusyChange(busy), [busy, onBusyChange])
  const errorProps = (field: AuthField) => ({
    value: values[field],
    // Read-only controls still participate in a native form submission.
    readOnly: posting,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `auth-${field}-error` : undefined,
  })
  const fieldError = (field: AuthField) =>
    errors[field] && (
      <span
        className="mt-2! block! text-sm! text-[var(--vv-error-text)]!"
        id={`auth-${field}-error`}
      >
        {errors[field]}
      </span>
    )

  useEffect(() => {
    if (state.errors) {
      form.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state])

  return (
    <form
      ref={form}
      action={register ? action : '/api/app-auth'}
      method={register ? undefined : 'post'}
      onSubmit={
        register
          ? undefined
          : async (event) => {
              event.preventDefault()
              if (inFlight.current) return
              const data = new FormData(event.currentTarget)
              inFlight.current = true
              setPosting(true)
              setLoginState(initial)
              try {
                const result = await loginWithBrowserSession(data)
                setLoginState(result)
                if (result.ok) {
                  router.replace('/mijn-account?auth=check')
                  // Route Handler cookies do not invalidate the client Router Cache.
                  router.refresh()
                }
              } finally {
                inFlight.current = false
                setPosting(false)
              }
            }
      }
      className="mt-8! space-y-4!"
      aria-busy={busy}
    >
      <p className="text-sm! text-[var(--vv-muted)]!">Alle velden zijn verplicht.</p>
      {register && (
        <div>
          <label className="block! text-sm! font-bold!" htmlFor="auth-name">
            Volledige naam
          </label>
          <input
            className={inputClass}
            id="auth-name"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            placeholder="Je voor- en achternaam"
            disabled={pending}
            required
            {...errorProps('name')}
          />
          {fieldError('name')}
        </div>
      )}
      <div>
        <label className="block! text-sm! font-bold!" htmlFor="auth-email">
          E-mailadres
        </label>
        <input
          className={inputClass}
          id="auth-email"
          name="email"
          type="email"
          autoComplete={register ? 'email' : 'username'}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder="naam@voorbeeld.nl"
          disabled={pending}
          required
          {...errorProps('email')}
        />
        {fieldError('email')}
      </div>
      <div>
        <label className="block! text-sm! font-bold!" htmlFor="auth-password">
          Wachtwoord
        </label>
        <div className="relative!">
          <input
            className={`${inputClass} pr-24!`}
            id="auth-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={register ? 8 : undefined}
            maxLength={128}
            placeholder={register ? 'Minimaal 8 tekens' : 'Je wachtwoord'}
            disabled={pending}
            required
            {...errorProps('password')}
          />
          <button
            className="absolute! inset-y-0! right-0! rounded-r-lg! px-4! text-sm! font-bold! text-[var(--vv-primary)]! focus-visible:outline-2! focus-visible:outline-offset-2!"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Verberg' : 'Toon'}
          </button>
        </div>
        {fieldError('password')}
      </div>
      {register && (
        <div>
          <label className="block! text-sm! font-bold!" htmlFor="auth-confirmPassword">
            Herhaal wachtwoord
          </label>
          <input
            className={inputClass}
            id="auth-confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="Nogmaals je wachtwoord"
            disabled={pending}
            required
            {...errorProps('confirmPassword')}
          />
          {fieldError('confirmPassword')}
        </div>
      )}
      <div aria-live="polite" aria-atomic="true">
        {state.message && (
          <p
            className={`rounded-lg! border! p-4! text-sm! leading-relaxed! ${state.ok || state.accountCreated ? 'border-[var(--vv-success-text)]/20! bg-[var(--vv-success-bg)]! text-[var(--vv-success-text)]!' : 'border-[var(--vv-error-text)]/20! bg-[var(--vv-error-bg)]! text-[var(--vv-error-text)]!'}`}
            role={state.ok || state.accountCreated ? 'status' : 'alert'}
          >
            {state.message}
          </p>
        )}
      </div>
      <button
        className="flex! w-full! items-center! justify-center! gap-3! rounded-lg! bg-[var(--vv-primary)]! px-5! py-4! text-base! font-bold! text-white! transition! hover:opacity-90! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--vv-primary)]! disabled:cursor-wait! disabled:opacity-60!"
        type="submit"
        disabled={busy || state.accountCreated}
      >
        {busy ? (
          <>
            <span
              className="h-4! w-4! animate-spin! rounded-full! border-2! border-white/30! border-t-white! motion-reduce:animate-none!"
              aria-hidden="true"
            />
            {state.ok ? 'Je omgeving openen…' : 'Even geduld…'}
          </>
        ) : register ? (
          'Klantaccount aanmaken'
        ) : (
          <>
            Inloggen <span aria-hidden="true">→</span>
          </>
        )}
      </button>
      {state.accountCreated && (
        <button
          className="w-full! rounded-lg! py-2! font-bold! underline! underline-offset-4!"
          type="button"
          onClick={onLogin}
        >
          Ga naar inloggen
        </button>
      )}
      {!register && (
        <details className="text-sm! leading-relaxed! text-[var(--vv-muted)]!">
          <summary className="cursor-pointer! rounded! py-1! font-bold! focus-visible:outline-2!">
            Hulp bij inloggen
          </summary>
          <p className="mt-3!">
            Gebruik het e-mailadres en wachtwoord van je Voyage Vista-account. Wachtwoord vergeten
            of nog geen medewerkersaccount? Neem contact op met je beheerder of contactpersoon bij
            Voyage Vista.
          </p>
        </details>
      )}
    </form>
  )
}

export default function AuthFormPanel({ initialMessage = '' }: { initialMessage?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const trip = params.get('trip')
    const intent =
      params.get('next') === 'reiswens' ? 'reiswens' : trip && trip.length <= 120 ? trip : null
    try {
      if (intent) sessionStorage.setItem('voyage-intent', intent)
    } catch {
      /* Login remains usable if browser storage is disabled. */
    }
  }, [])
  return (
    <div>
      <p className="text-sm! font-bold! tracking-[0.18em]! text-[var(--vv-muted)]!">
        MIJN VOYAGE VISTA
      </p>
      <h2 className="mt-3! text-[32px]! font-bold! text-[var(--vv-primary)]!" id="auth-title">
        {mode === 'login' ? 'Welkom terug' : 'Welkom bij Voyage Vista'}
      </h2>
      <p className="mt-3! text-base! leading-relaxed! text-[var(--vv-muted)]!">
        {mode === 'login'
          ? 'Log in met je app-account om verder te gaan.'
          : 'Maak je klantaccount aan en ga direct aan de slag: reizen boeken en je eigen reiswensen indienen.'}
      </p>
      {initialMessage && (
        <p
          className="mt-5! rounded-lg! border! border-[var(--vv-border)]! bg-[var(--vv-warning-bg)]! p-4! text-sm! leading-relaxed! text-[var(--vv-warning-text)]!"
          role="alert"
        >
          {initialMessage}
        </p>
      )}
      <ErrorBoundary>
        <AuthForm key={mode} mode={mode} onLogin={() => setMode('login')} onBusyChange={setBusy} />
      </ErrorBoundary>
      <div className="mt-8! border-t! border-[var(--vv-border)]! pt-6! text-center! text-sm! text-[var(--vv-muted)]!">
        <p>{mode === 'login' ? 'Nog geen klantaccount?' : 'Heb je al een account?'}</p>
        <button
          type="button"
          className="mt-2! rounded! py-1! font-bold! text-[var(--vv-primary)]! underline! decoration-[var(--vv-accent)]! underline-offset-4! focus-visible:outline-2! focus-visible:outline-offset-4!"
          disabled={busy}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Klantaccount aanmaken' : 'Terug naar inloggen'}
        </button>
      </div>
      <p className="mt-8! text-center! text-sm! leading-relaxed! text-[var(--vv-muted)]!">
        Voor klanten en medewerkers. Medewerkersaccounts worden door de beheerder aangemaakt.
      </p>
    </div>
  )
}
