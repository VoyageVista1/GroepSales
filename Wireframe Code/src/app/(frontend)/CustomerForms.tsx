'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bookTripAction, createQuestionAction, type DataResult } from '@/actions/voyage'
import { travelWishErrors } from '@/lib/travel-wish'
import { bookingPrice } from '@/lib/booking-rules'
import type { Travel } from '@/types/voyage'

const field =
  'mt-2! block! min-h-11! w-full! min-w-0! rounded-lg! border! border-[var(--vv-border)]! bg-white! px-3! py-3! text-base! font-normal! text-[var(--vv-text)]!'
const label = 'block! text-base! font-bold! normal-case! tracking-normal! text-[var(--vv-primary)]!'
const euro = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)

function Result({ result }: { result: DataResult | null }) {
  return result ? (
    <div
      className={`rounded-xl! border! p-4! ${result.ok ? 'border-[var(--vv-success-text)]! bg-[var(--vv-success-bg)]! text-[var(--vv-success-text)]!' : 'border-[var(--vv-error-text)]! bg-[var(--vv-error-bg)]! text-[var(--vv-error-text)]!'}`}
      role={result.ok ? 'status' : 'alert'}
    >
      <p>{result.message}</p>
      {result.reference && (
        <p className="mt-2! break-all! font-bold!">Referentie: {result.reference}</p>
      )}
    </div>
  ) : null
}

export function TravelWishForm({
  onCancel,
  onHistory,
}: {
  onCancel: () => void
  onHistory: () => void
}) {
  const router = useRouter()
  const [values, setValues] = useState({
    destination: '',
    period: '',
    startDate: '',
    endDate: '',
    travellers: '2',
    budget: '',
    departure: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [review, setReview] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<DataResult | null>(null)
  const inFlight = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const input = () => ({
    ...values,
    travellers: Number(values.travellers),
    budgetMax: values.budget === '' ? undefined : Number(values.budget),
  })
  const change = (name: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setResult(null)
  }
  const props = (name: keyof typeof values) => ({
    id: `wish-${name}`,
    value: values[name],
    disabled: pending,
    className: field,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      change(name, event.target.value),
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `wish-${name}-error` : undefined,
  })
  const error = (name: string) =>
    errors[name] && (
      <span className="field-error" id={`wish-${name}-error`}>
        {errors[name]}
      </span>
    )
  const check = () => {
    const issues = travelWishErrors(input())
    // The budget input uses the same name as its error association.
    if (issues.budgetMax) {
      issues.budget = issues.budgetMax
      delete issues.budgetMax
    }
    setErrors(issues)
    if (Object.keys(issues).length) {
      setResult({ ok: false, message: 'Controleer de aangegeven velden.' })
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      )
      return false
    }
    return true
  }
  const submit = async () => {
    if (inFlight.current || !check()) return
    inFlight.current = true
    setPending(true)
    try {
      const response = await createQuestionAction({
        ...input(),
        category: 'Reiswens',
        subject: `Reiswens: ${values.destination}`.slice(0, 200),
        budget: values.budget ? `${euro(Number(values.budget))} totaal` : 'In overleg',
      })
      setResult(response)
      if (response.ok) router.refresh()
      else if (response.errors) {
        setErrors(response.errors)
        setReview(false)
      }
    } catch {
      setResult({
        ok: false,
        message: 'Versturen is niet gelukt. Controleer je verbinding en probeer opnieuw.',
      })
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  const cancel = () => {
    const dirty =
      values.destination ||
      values.period ||
      values.message ||
      values.budget ||
      values.departure ||
      values.startDate ||
      values.endDate ||
      values.travellers !== '2'
    if (
      !dirty ||
      result?.ok ||
      window.confirm('Je reiswens is nog niet verstuurd. Wil je deze gegevens verlaten?')
    )
      onCancel()
  }
  return (
    <section className="rounded-xl! border! border-[var(--vv-border)]! bg-white! p-4! sm:p-8!">
      {result?.ok ? (
        <div className="space-y-6!">
          <Result result={result} />
          <p>
            Je reisspecialist behandelt je reiswens. Je vindt de status en het antwoord bij Mijn
            reis → Mijn aanvragen. Dit is een vrijblijvende aanvraag.
          </p>
          <button className="button button-primary" onClick={onHistory}>
            Bekijk mijn aanvragen
          </button>
        </div>
      ) : (
        <form
          ref={form}
          noValidate
          aria-busy={pending}
          onSubmit={(event) => {
            event.preventDefault()
            if (review) void submit()
            else if (check()) {
              setReview(true)
              setResult(null)
            }
          }}
          className="space-y-6!"
        >
          <p className="text-base! text-[var(--vv-muted)]!">
            Stap {review ? '2 van 2: controleren en versturen' : '1 van 2: jouw reisidee'}. Velden
            met * zijn verplicht. Je contactgegevens gebruiken we vanuit je account.
          </p>
          <Result result={result} />
          {!review ? (
            <>
              <fieldset className="grid! min-w-0! gap-4! border-0! p-0! sm:grid-cols-2!">
                <legend className="mb-4! text-2xl! font-bold!">Bestemming en periode</legend>
                <label className={label}>
                  Bestemming *
                  <input
                    {...props('destination')}
                    maxLength={200}
                    required
                    placeholder="Bijvoorbeeld Japan, of Nog te bepalen"
                  />
                  {error('destination')}
                </label>
                <label className={label}>
                  Gewenste periode en flexibiliteit *
                  <input
                    {...props('period')}
                    maxLength={200}
                    required
                    placeholder="Bijvoorbeeld 2 weken in mei, data flexibel"
                  />
                  {error('period')}
                </label>
                <label className={label}>
                  Vertrekdatum (optioneel)
                  <input
                    {...props('startDate')}
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  {error('startDate')}
                </label>
                <label className={label}>
                  Terugkomstdatum (optioneel)
                  <input
                    {...props('endDate')}
                    type="date"
                    min={values.startDate || new Date().toISOString().slice(0, 10)}
                  />
                  {error('endDate')}
                </label>
              </fieldset>
              <fieldset className="grid! min-w-0! gap-4! border-0! p-0! sm:grid-cols-2!">
                <legend className="mb-4! text-2xl! font-bold!">Gezelschap en budget</legend>
                <label className={label}>
                  Aantal reizigers *
                  <input
                    {...props('travellers')}
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    required
                  />
                  {error('travellers')}
                </label>
                <label className={label}>
                  Maximaal totaalbudget in euro (optioneel)
                  <input
                    {...props('budget')}
                    type="number"
                    min={0}
                    max={1000000000}
                    step="0.01"
                    placeholder="Voor het hele reisgezelschap"
                  />
                  {error('budget')}
                </label>
                <label className={`${label} sm:col-span-2!`}>
                  Voorkeursvertrekplaats of vervoer (optioneel)
                  <input
                    {...props('departure')}
                    maxLength={200}
                    placeholder="Bijvoorbeeld trein vanuit Utrecht of vertrek vanaf Schiphol"
                  />
                  {error('departure')}
                </label>
              </fieldset>
              <label className={label}>
                Wat maakt deze reis voor jou geslaagd? *
                <textarea
                  {...props('message')}
                  rows={5}
                  maxLength={5000}
                  required
                  placeholder="Denk aan reisstijl, activiteiten, soort verblijf en leeftijden van meereizende kinderen. Deel hier geen paspoort- of medische gegevens."
                />
                {error('message')}
              </label>
            </>
          ) : (
            <dl className="grid! gap-4! text-base! sm:grid-cols-2!">
              {[
                ['Bestemming', values.destination],
                ['Periode', values.period],
                [
                  'Reisdata',
                  values.startDate
                    ? `${values.startDate} – ${values.endDate}`
                    : 'Flexibel / in overleg',
                ],
                ['Reizigers', values.travellers],
                ['Totaalbudget', values.budget ? euro(Number(values.budget)) : 'In overleg'],
                ['Vertrek', values.departure || 'In overleg'],
                ['Voorkeuren', values.message],
              ].map(([term, value]) => (
                <div key={term} className="min-w-0!">
                  <dt className="font-bold!">{term}</dt>
                  <dd className="m-0! whitespace-pre-wrap! break-words! text-[var(--vv-muted)]!">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex! flex-wrap! gap-3! border-t! border-[var(--vv-border)]! pt-6!">
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              onClick={
                review
                  ? () => {
                      setReview(false)
                      setResult(null)
                    }
                  : cancel
              }
            >
              {review ? 'Gegevens aanpassen' : 'Annuleren'}
            </button>
            <button type="submit" className="button button-primary" disabled={pending}>
              {pending ? 'Versturen…' : review ? 'Reiswens versturen' : 'Controleer reiswens'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export function BookingCheckout({
  travel,
  name,
  email,
  initialTravellers = 2,
  onCancel,
  onBooked,
}: {
  travel: Travel
  name: string
  email: string
  initialTravellers?: number
  onCancel: () => void
  onBooked: (reference: string) => void
}) {
  const router = useRouter()
  const [travellers, setTravellers] = useState(
    String(Math.min(initialTravellers, travel.maxTravellers)),
  )
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<DataResult | null>(null)
  const requestKey = useRef('')
  const inFlight = useRef(false)
  const count = Number(travellers)
  const valid =
    Number.isInteger(count) &&
    count >= 1 &&
    count <= Math.min(travel.maxTravellers, travel.remainingSpots ?? travel.maxTravellers)
  const pricing = bookingPrice(travel, valid ? count : 1)
  const available =
    travel.available &&
    travel.startDate >= new Date().toISOString().slice(0, 10) &&
    !pricing.unavailable
  return (
    <form
      aria-busy={pending}
      className="space-y-6! rounded-xl! border! border-[var(--vv-border)]! bg-white! p-4! sm:p-8!"
      onSubmit={async (event) => {
        event.preventDefault()
        if (inFlight.current || !valid || !available || !confirmed) return
        inFlight.current = true
        setPending(true)
        setResult(null)
        requestKey.current ||= crypto.randomUUID()
        try {
          const response = await bookTripAction({
            tripId: travel.catalogId,
            travellers: count,
            totalAmount: pricing.totalAmount,
            confirmed,
            requestKey: requestKey.current,
          })
          setResult(response)
          if (response.ok) router.refresh()
        } catch {
          setResult({
            ok: false,
            message:
              'Boeken is niet gelukt. Probeer opnieuw; dezelfde poging maakt geen tweede boeking aan.',
          })
        } finally {
          inFlight.current = false
          setPending(false)
        }
      }}
    >
      <Result result={result} />
      {result?.ok ? (
        <button
          type="button"
          className="button button-primary"
          onClick={() => onBooked(result.reference ?? '')}
        >
          Bekijk mijn boeking
        </button>
      ) : (
        <>
          <div>
            <h2 className="text-2xl!">{travel.title}</h2>
            <p className="mt-2! text-base! text-[var(--vv-muted)]!">
              {travel.dates || `${travel.startDate} – ${travel.endDate}`} · {travel.duration}{' '}
              nachten
            </p>
          </div>
          <p className="text-base!">
            Hoofdboeker: <b>{name}</b>
            <br />
            Contact: {email}
          </p>
          <label className={label}>
            Aantal reizigers *
            <input
              type="number"
              className={field}
              value={travellers}
              min={1}
              max={Math.min(travel.maxTravellers, travel.remainingSpots ?? travel.maxTravellers)}
              step={1}
              required
              disabled={pending}
              aria-invalid={!valid}
              aria-describedby={!valid ? 'booking-count-error' : undefined}
              onChange={(event) => {
                setTravellers(event.target.value)
                setConfirmed(false)
                requestKey.current = ''
                setResult(null)
              }}
            />
            {!valid && (
              <span className="field-error" id="booking-count-error">
                Kies een geheel aantal van 1 tot{' '}
                {Math.min(travel.maxTravellers, travel.remainingSpots ?? travel.maxTravellers)}{' '}
                reizigers.
              </span>
            )}
          </label>
          <div className="rounded-xl! bg-[var(--vv-page)]! p-4!">
            <h3 className="text-xl!">Jouw reissom</h3>
            <ul className="mt-4! list-none! space-y-3! p-0!">
              {pricing.lineItems.map((line) => (
                <li className="flex! flex-wrap! justify-between! gap-2! text-base!" key={line.key}>
                  <span>
                    {line.label} ({line.quantity} × {euro(line.unitPrice)})
                  </span>
                  <b>{euro(line.unitPrice * line.quantity)}</b>
                </li>
              ))}
              <li className="flex! flex-wrap! justify-between! gap-2! text-base!">
                <span>Servicekosten ({valid ? count : 1} × € 39)</span>
                <b>{euro(pricing.serviceCosts)}</b>
              </li>
            </ul>
            <p className="mt-4! flex! flex-wrap! justify-between! gap-2! border-t! border-[var(--vv-border)]! pt-4! text-xl! font-bold!">
              <span>Totaal voor het reisgezelschap</span>
              <span>{euro(pricing.totalAmount)}</span>
            </p>
          </div>
          <p className="text-base! text-[var(--vv-muted)]!">
            Je boekt het getoonde pakket als optie. Er wordt nu geen betaling afgeschreven. Je
            reisspecialist bevestigt de beschikbaarheid en geeft betaalinformatie. Eventuele lokale
            heffingen betaal je ter plaatse; vraag het actuele tarief aan je specialist.
          </p>
          {!available && (
            <Result
              result={{
                ok: false,
                message:
                  'Dit pakket is momenteel niet direct te boeken. Dien een reiswens in of vraag een persoonlijk voorstel aan.',
              }}
            />
          )}
          <label className="flex! items-start! gap-3! text-base! font-normal! normal-case! tracking-normal!">
            <input
              type="checkbox"
              className="mt-1! h-5! w-5! shrink-0!"
              checked={confirmed}
              required
              disabled={pending}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              Ik heb de reis, het aantal reizigers en de totale reissom gecontroleerd en wil deze
              reis als optie boeken.
            </span>
          </label>
          <div className="flex! flex-wrap! gap-3!">
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              onClick={() => {
                if (
                  (!confirmed && travellers === '2') ||
                  window.confirm('Je boeking is nog niet verstuurd. Wil je deze pagina verlaten?')
                )
                  onCancel()
              }}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={pending || !confirmed || !valid || !available}
            >
              {pending ? 'Boeking opslaan…' : 'Boek reis als optie'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
