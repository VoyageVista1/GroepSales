'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import type { PublicTravel } from '@/types/public-travel'
import Dialog from './Dialog'
import SiteIcon from './SiteIcon'
import PublicHeader, { Brand } from './PublicHeader'

const button =
  'inline-flex! min-h-11! items-center! justify-center! gap-2! rounded-lg! border! border-transparent! bg-[var(--vv-accent-strong)]! px-4! py-3! text-base! font-bold! text-white! no-underline! transition! hover:brightness-90! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--vv-primary)]!'
const field =
  'mt-2! block! min-h-11! w-full! min-w-0! rounded-lg! border! border-[var(--vv-border)]! bg-white! px-4! py-3! text-base! text-[var(--vv-text)]! outline-none! focus:border-[var(--vv-primary)]! focus:ring-2! focus:ring-[var(--vv-mint)]!'
const price = (value: number | null) =>
  value === null
    ? 'Prijs op aanvraag'
    : new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value)

function period(trip: PublicTravel) {
  if (trip.period) return trip.period
  const formatter = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const start = new Date(trip.startDate),
    end = new Date(trip.endDate)
  return Number.isFinite(start.valueOf()) && Number.isFinite(end.valueOf())
    ? `${formatter.format(start)} – ${formatter.format(end)}`
    : 'Periode op aanvraag'
}

function TravelImage({
  trip,
  eager = false,
  hero = false,
}: {
  trip: PublicTravel
  eager?: boolean
  hero?: boolean
}) {
  // The hero fits within 960 CSS pixels. Its intrinsic/DPR source set also
  // separates its eager fallback from a lazy card reusing the same upload:
  // Next's development LCP registry is keyed by the fallback image URL.
  return trip.image ? (
    <Image
      src={trip.image}
      alt={trip.imageAlt}
      fill={!hero}
      width={hero ? 960 : undefined}
      height={hero ? 720 : undefined}
      sizes={hero ? undefined : '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw'}
      className="absolute! inset-0! h-full! w-full! object-cover!"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
    />
  ) : (
    <div className="flex! h-full! min-h-48! items-center! justify-center! bg-[var(--vv-subtle)]! text-sm! text-[var(--vv-muted)]!">
      Reisfoto volgt
    </div>
  )
}

export default function PublicHome({
  trips,
  navigation,
  notice,
  onRequestTrip,
  onTravelWish,
}: {
  trips: PublicTravel[]
  navigation?: ReactNode
  notice?: ReactNode
  onRequestTrip?: (trip: PublicTravel) => void
  onTravelWish?: () => void
}) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [budget, setBudget] = useState('')
  const [sort, setSort] = useState('departure')
  const [selected, setSelected] = useState<PublicTravel | null>(null)
  const hero =
    trips.find((trip) => trip.image && trip.available) ?? trips.find((trip) => trip.image)
  const countries = [...new Set(trips.map((trip) => trip.country).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'nl'),
  )
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('nl')
    const maximum = budget.trim() && Number.isFinite(Number(budget)) ? Number(budget) : Infinity
    return trips
      .filter(
        (trip) =>
          (!country || trip.country === country) &&
          (!needle ||
            `${trip.title} ${trip.destination} ${trip.country} ${trip.description}`
              .toLocaleLowerCase('nl')
              .includes(needle)) &&
          (maximum === Infinity || (trip.price !== null && trip.price <= maximum)),
      )
      .sort((a, b) =>
        sort === 'price'
          ? (a.price ?? Infinity) - (b.price ?? Infinity)
          : a.startDate.localeCompare(b.startDate),
      )
  }, [trips, query, country, budget, sort])

  const hasFilters = Boolean(query || country || budget || sort !== 'departure')
  const clearFilters = () => {
    setQuery('')
    setCountry('')
    setBudget('')
    setSort('departure')
  }
  const activeFilters = [
    query && `Zoeken: ${query}`,
    country && `Bestemming: ${country}`,
    budget && `Maximaal: ${price(Number(budget))}`,
    sort !== 'departure' && 'Sortering: laagste vanafprijs',
  ].filter(Boolean)

  return (
    <div className="min-h-svh! bg-[var(--vv-page)]! text-[var(--vv-text)]!">
      <a
        href="#reisaanbod"
        className="sr-only! focus:not-sr-only! focus:absolute! focus:z-50! focus:bg-white! focus:p-4!"
      >
        Direct naar het reisaanbod
      </a>
      <PublicHeader>{navigation}</PublicHeader>
      {notice}

      <main className="m-0! w-full! max-w-none! p-0!">
        <section
          className="mx-auto! grid! max-w-[1280px]! items-center! gap-8! px-4! pb-8! pt-8! sm:px-6! lg:grid-cols-2! lg:gap-8! lg:px-8! lg:pb-8! lg:pt-8!"
          aria-labelledby="public-title"
        >
          <div className="min-w-0!">
            <p className="mb-4! text-sm! font-bold! tracking-[0.2em]! text-[var(--vv-accent-strong)]!">
              MOOIE REIZEN. PERSOONLIJKE AANDACHT.
            </p>
            <h1
              id="public-title"
              className="max-w-lg! text-[32px]! font-bold! leading-tight! tracking-[-0.04em]! text-[var(--vv-primary)]! sm:text-[32px]! lg:text-[32px]!"
            >
              De wereld ligt
              <br />
              voor je open.
            </h1>
            <p className="mt-6! max-w-md! text-base! leading-relaxed! text-[var(--vv-muted)]!">
              Een nieuwe bestemming, een bijzonder verhaal. Ontdek onze reizen en vind de plek die
              bij jou past.
            </p>
            <div className="mt-8! flex! flex-wrap! items-center! gap-4!">
              <a href="#reisaanbod" className={button}>
                Ontdek onze reizen <SiteIcon name="arrow-down" />
              </a>
              <span className="text-sm! text-[var(--vv-muted)]!">
                Vrij rondkijken, zonder account.
              </span>
            </div>
            <div className="mt-8! flex! items-center! gap-3! border-t! border-[var(--vv-border)]! pt-6! text-sm! text-[var(--vv-muted)]!">
              <SiteIcon name="check" className="text-[var(--vv-accent-strong)]!" />
              Van het eerste reisidee tot het moment van vertrek.
            </div>
          </div>
          <div className="relative! isolate! min-h-[320px]! overflow-hidden! rounded-xl! bg-[var(--vv-nav)]! sm:min-h-[430px]!">
            {hero ? (
              <>
                <TravelImage trip={hero} eager hero />
                <div className="absolute! inset-0! bg-gradient-to-t! from-black/70! via-transparent! to-transparent!" />
                <div className="absolute! inset-x-0! bottom-0! p-8! text-white!">
                  <span className="text-sm! font-bold! uppercase! tracking-[0.15em]!">
                    Een wereld om te ontdekken
                  </span>
                  <p className="mt-2! text-2xl! font-bold! text-white!">{hero.destination}</p>
                  <span className="mt-2! block! text-sm! text-white/80!">{hero.country}</span>
                </div>
              </>
            ) : (
              <div className="relative! flex! min-h-[320px]! flex-col! justify-end! overflow-hidden! p-8! sm:min-h-[430px]!">
                <div
                  className="pointer-events-none! absolute! -right-24! -top-12! h-96! w-96! rounded-full! border! border-white/20!"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none! absolute! -right-8! top-4! h-64! w-64! rounded-full! border! border-[var(--vv-mint)]/40!"
                  aria-hidden="true"
                />
                <SiteIcon name="plane" className="relative! h-12! w-12! text-[var(--vv-mint)]!" />
                <p className="relative! mt-8! max-w-xs! text-2xl! font-bold! leading-tight! text-white!">
                  Waar gaat jouw volgende verhaal naartoe?
                </p>
              </div>
            )}
            <span className="absolute! left-6! top-6! rounded-full! bg-white! px-4! py-2! text-sm! font-bold! text-[var(--vv-primary)]!">
              VOYAGE VISTA SELECTIE
            </span>
          </div>
        </section>

        <section
          id="reisaanbod"
          className="scroll-mt-6! border-y! border-[var(--vv-border)]! bg-[var(--vv-page)]! px-4! py-8! sm:px-6! lg:px-8!"
          aria-labelledby="catalog-title"
        >
          <div className="mx-auto! max-w-[1216px]!">
            <div className="mb-8! flex! flex-wrap! items-end! justify-between! gap-4!">
              <div>
                <p className="mb-2! text-sm! font-bold! tracking-[0.18em]! text-[var(--vv-accent-strong)]!">
                  KIES JOUW VOLGENDE BESTEMMING
                </p>
                <h2 id="catalog-title" className="text-2xl! font-bold! text-[var(--vv-primary)]!">
                  Een reis die bij je past
                </h2>
                <p className="mt-3! text-base! text-[var(--vv-muted)]!">
                  Bekijk de bestemmingen, ontdek de details en laat je inspireren.
                </p>
              </div>
              <span className="text-sm! text-[var(--vv-muted)]!" role="status" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? 'reis' : 'reizen'}
              </span>
            </div>
            <form
              className="mb-8! grid! gap-4! rounded-xl! border! border-[var(--vv-border)]! bg-[var(--vv-page)]! p-4! sm:grid-cols-2! lg:grid-cols-[1.3fr_1fr_0.8fr_1fr]!"
              onSubmit={(event) => event.preventDefault()}
              role="search"
              aria-label="Reisaanbod doorzoeken"
            >
              <label className="min-w-0! text-sm! font-bold! text-[var(--vv-primary)]!">
                Zoek een reis
                <input
                  className={field}
                  type="search"
                  placeholder="Bestemming of reisnaam"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="min-w-0! text-sm! font-bold! text-[var(--vv-primary)]!">
                Bestemming
                <select
                  className={field}
                  aria-label="Bestemming"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                >
                  <option value="">Alle landen</option>
                  {countries.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="min-w-0! text-sm! font-bold! text-[var(--vv-primary)]!">
                Max. vanafprijs p.p.
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="50"
                  placeholder="Geen maximum"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </label>
              <label className="min-w-0! text-sm! font-bold! text-[var(--vv-primary)]!">
                Sorteren
                <select
                  className={field}
                  aria-label="Sorteren"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="departure">Vertrekdatum</option>
                  <option value="price">Laagste vanafprijs</option>
                </select>
              </label>
            </form>
            {hasFilters && (
              <div
                className="mb-6! flex! flex-wrap! items-center! gap-3!"
                aria-label="Actieve filters"
              >
                {activeFilters.map((label) => (
                  <span
                    key={String(label)}
                    className="rounded-lg! border! border-[var(--vv-border)]! bg-white! px-3! py-2! text-sm! text-[var(--vv-primary)]!"
                  >
                    {label}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex! min-h-11! items-center! rounded-lg! border! border-[var(--vv-primary)]! bg-white! px-4! py-2! text-base! font-bold! text-[var(--vv-primary)]! focus-visible:outline-2! focus-visible:outline-offset-2!"
                >
                  Filters wissen
                </button>
              </div>
            )}

            {filtered.length ? (
              <div className="grid! gap-6! md:grid-cols-2! lg:grid-cols-3!">
                {filtered.map((trip) => (
                  <article
                    key={trip.id}
                    className="flex! min-w-0! flex-col! overflow-hidden! rounded-xl! border! border-[var(--vv-border)]! bg-white!"
                  >
                    <div className="relative! h-56! overflow-hidden!">
                      <TravelImage trip={trip} />
                      <span className="absolute! bottom-4! left-4! rounded-full! bg-white! px-3! py-1.5! text-sm! font-bold! text-[var(--vv-primary)]!">
                        {trip.country || 'Reisbestemming'}
                      </span>
                    </div>
                    <div className="flex! flex-1! flex-col! p-6!">
                      <p className="mb-2! text-sm! font-bold! tracking-[0.08em]! text-[var(--vv-muted)]!">
                        {trip.destination} · {trip.nights} {trip.nights === 1 ? 'nacht' : 'nachten'}
                      </p>
                      <h3 className="text-xl! font-bold! leading-tight! text-[var(--vv-primary)]!">
                        {trip.title}
                      </h3>
                      <p className="mt-3! line-clamp-3! text-base! leading-relaxed! text-[var(--vv-muted)]!">
                        {trip.description}
                      </p>
                      <p className="mb-4! mt-4! text-sm! text-[var(--vv-muted)]!">{period(trip)}</p>
                      <div className="mt-auto! flex! items-end! justify-between! gap-3! border-t! border-[var(--vv-border)]! pt-4!">
                        <div>
                          <span className="block! text-sm! text-[var(--vv-muted)]!">
                            {trip.price === null ? 'Persoonlijk voorstel' : 'Vanaf per persoon'}
                          </span>
                          <strong className="mt-1! block! text-2xl! font-bold! text-[var(--vv-primary)]!">
                            {price(trip.price)}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className={button}
                          onClick={() => setSelected(trip)}
                          aria-label={`Bekijk ${trip.title}`}
                        >
                          Bekijk reis <SiteIcon name="arrow-right" />
                        </button>
                      </div>
                      {!trip.available && (
                        <p className="mt-3! w-fit! rounded-lg! bg-[var(--vv-warning-bg)]! px-3! py-2! text-sm! font-bold! text-[var(--vv-warning-text)]!">
                          Tijdelijk niet beschikbaar
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl! border! border-dashed! border-[var(--vv-border)]! bg-white! px-4! py-8! text-center!">
                <h3 className="text-xl! font-bold! text-[var(--vv-primary)]!">
                  {trips.length
                    ? 'Nog niet de juiste reis gevonden?'
                    : 'Ons reisaanbod volgt binnenkort'}
                </h3>
                <p className="mx-auto! mt-3! max-w-md! text-base! leading-relaxed! text-[var(--vv-muted)]!">
                  {trips.length
                    ? 'Probeer een andere bestemming, een ruimer budget of wis je filters.'
                    : 'Zodra onze reizen beschikbaar zijn, vind je hier de bestemmingen, vertrekdata en vanafprijzen.'}
                </p>
                {trips.length > 0 && (
                  <button type="button" className={`${button} mt-6!`} onClick={clearFilters}>
                    Filters wissen
                  </button>
                )}
              </div>
            )}
            <div className="mt-8! flex! flex-wrap! items-center! justify-between! gap-4! rounded-xl! border! border-[var(--vv-border)]! bg-white! p-6!">
              <div>
                <h3 className="text-xl! font-bold! text-[var(--vv-primary)]!">
                  Liever een reis op maat?
                </h3>
                <p className="mt-2! text-base! text-[var(--vv-muted)]!">
                  Vertel ons waar je naartoe wilt, wanneer en wat je belangrijk vindt.
                </p>
              </div>
              {onTravelWish ? (
                <button type="button" className={button} onClick={onTravelWish}>
                  Dien je reiswens in
                </button>
              ) : (
                <a href="/inloggen?next=reiswens" className={button}>
                  Dien je reiswens in
                </a>
              )}
            </div>
          </div>
        </section>

        <section
          id="werkwijze"
          className="mx-auto! max-w-[1280px]! px-4! py-8! sm:px-6! lg:px-8!"
          aria-labelledby="approach-title"
        >
          <p className="text-sm! font-bold! tracking-[0.18em]! text-[var(--vv-accent-strong)]!">
            JOUW REIS, ONZE AANDACHT
          </p>
          <h2 id="approach-title" className="mt-3! text-2xl! font-bold! text-[var(--vv-primary)]!">
            Van nieuwsgierig naar op reis.
          </h2>
          <div className="mt-8! grid! gap-8! md:grid-cols-3!">
            {[
              [
                '01',
                'Kijk rustig rond',
                'Bekijk alle reizen en reisdetails. Je hoeft hiervoor niet in te loggen.',
              ],
              [
                '02',
                'Maak het persoonlijk',
                'Wil je een voorstel of reisadvies? Log in of maak een klantaccount aan voor contact met ons team.',
              ],
              [
                '03',
                'Alles bij elkaar',
                'In Mijn Voyage Vista vind je je persoonlijke voorstellen, boekingen en contact met je reisspecialist.',
              ],
            ].map(([number, title, text]) => (
              <div key={number} className="border-t! border-[var(--vv-border)]! pt-6!">
                <span className="text-sm! font-bold! text-[var(--vv-accent-strong)]!">
                  {number}
                </span>
                <h3 className="mt-4! text-xl! font-bold! text-[var(--vv-primary)]!">{title}</h3>
                <p className="mt-3! text-base! leading-relaxed! text-[var(--vv-muted)]!">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-[var(--vv-nav)]! px-4! py-8! text-white! sm:px-6! lg:px-8!">
          <div className="mx-auto! flex! max-w-[1216px]! flex-wrap! items-center! justify-between! gap-8!">
            <div>
              <h2 className="text-2xl! font-bold! text-white!">Al een reis op het oog?</h2>
              <p className="mt-3! max-w-xl! text-base! leading-relaxed! text-white/75!">
                Met je eigen klantaccount houd je contact met Voyage Vista en vind je alle
                voorstellen op één plek.
              </p>
            </div>
            <a
              href="/inloggen"
              className="inline-flex! min-h-11! items-center! gap-2! rounded-lg! border! border-[var(--vv-border)]! bg-white! px-4! py-3! text-base! font-bold! text-[var(--vv-primary)]! no-underline! hover:bg-[var(--vv-subtle)]! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--vv-mint)]!"
            >
              Naar Mijn Voyage Vista <SiteIcon name="arrow-right" />
            </a>
          </div>
        </section>
      </main>
      <footer className="flex! w-full! flex-wrap! items-center! justify-center! gap-8! bg-[var(--vv-nav)]! px-4! py-8! text-white! sm:px-6! lg:px-8!">
        <Brand light />
        <p className="text-base! text-white!">Jouw reis begint met een beetje nieuwsgierigheid.</p>
        <a
          href={navigation ? '/' : '/inloggen'}
          className="inline-flex! min-h-11! items-center! rounded-lg! px-3! text-base! font-bold! text-white! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-mint)]!"
        >
          {navigation ? 'Homepagina' : 'Inloggen'}
        </a>
      </footer>

      {selected && (
        <Dialog
          titleId="public-trip-title"
          className="fixed! inset-0! z-50! flex! items-center! justify-center! overflow-y-auto! bg-black/50! p-4! sm:p-8!"
          onClose={() => setSelected(null)}
        >
          <section className="relative! max-h-[90svh]! w-full! max-w-2xl! overflow-y-auto! rounded-xl! bg-[var(--vv-page)]!">
            <button
              type="button"
              className="close absolute! right-4! top-4! z-10! grid! h-11! w-11! place-items-center! rounded-lg! border! border-[var(--vv-border)]! bg-white! text-[var(--vv-primary)]! focus-visible:outline-2! focus-visible:outline-offset-2!"
              aria-label="Reisdetails sluiten"
              onClick={() => setSelected(null)}
            >
              <SiteIcon name="close" />
            </button>
            <div className="relative! h-56! overflow-hidden! sm:h-72!">
              <TravelImage trip={selected} eager />
            </div>
            <div className="p-6! sm:p-8!">
              <p className="text-sm! font-bold! text-[var(--vv-accent-strong)]!">
                {selected.destination}
                {selected.country ? ` · ${selected.country}` : ''}
              </p>
              <h2
                id="public-trip-title"
                className="mt-3! text-2xl! font-bold! leading-tight! text-[var(--vv-primary)]!"
              >
                {selected.title}
              </h2>
              <p className="mt-4! whitespace-pre-line! text-base! leading-relaxed! text-[var(--vv-muted)]!">
                {selected.description}
              </p>
              <dl className="my-6! grid! grid-cols-2! gap-4! rounded-xl! bg-white! p-4! text-sm!">
                <div>
                  <dt className="text-[var(--vv-muted)]!">Reisperiode</dt>
                  <dd className="m-0! mt-1! font-bold!">{period(selected)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--vv-muted)]!">Verblijf</dt>
                  <dd className="m-0! mt-1! font-bold!">{selected.nights} nachten</dd>
                </div>
                <div>
                  <dt className="text-[var(--vv-muted)]!">Vanafprijs per persoon</dt>
                  <dd className="m-0! mt-1! font-bold!">{price(selected.price)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--vv-muted)]!">Reisgezelschap</dt>
                  <dd className="m-0! mt-1! font-bold!">Tot {selected.maxTravellers} personen</dd>
                </div>
              </dl>
              {selected.facilities.length > 0 && (
                <>
                  <h3 className="text-base! font-bold! text-[var(--vv-primary)]!">
                    Goed om te weten
                  </h3>
                  <ul className="mt-3! list-none! space-y-2! p-0! text-base! text-[var(--vv-muted)]!">
                    {selected.facilities.map((facility, i) => (
                      <li key={`${i}-${facility}`}>
                        <span className="mr-2! text-[var(--vv-accent-strong)]!" aria-hidden="true">
                          ✓
                        </span>
                        {facility}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-6! border-t! border-[var(--vv-border)]! pt-6!">
                {selected.available ? (
                  <>
                    {onRequestTrip ? (
                      <button
                        type="button"
                        className={button}
                        onClick={() => {
                          setSelected(null)
                          onRequestTrip(selected)
                        }}
                      >
                        Selecteer deze reis <SiteIcon name="arrow-right" />
                      </button>
                    ) : (
                      <a
                        href={`/inloggen?trip=${encodeURIComponent(selected.id)}`}
                        className={button}
                      >
                        Selecteer en boek deze reis <SiteIcon name="arrow-right" />
                      </a>
                    )}
                    <p className="mt-3! text-sm! leading-relaxed! text-[var(--vv-muted)]!">
                      {onRequestTrip
                        ? 'Boek het pakket of vraag een persoonlijk voorstel aan.'
                        : 'Log hiervoor in of maak een klantaccount aan.'}{' '}
                      Je definitieve reissom en beschikbaarheid vind je in je persoonlijke voorstel.
                    </p>
                  </>
                ) : (
                  <p className="text-base! text-[var(--vv-muted)]!">
                    Deze reis is op dit moment niet beschikbaar. Bekijk het overige reisaanbod voor
                    een alternatief.
                  </p>
                )}
              </div>
            </div>
          </section>
        </Dialog>
      )}
    </div>
  )
}
