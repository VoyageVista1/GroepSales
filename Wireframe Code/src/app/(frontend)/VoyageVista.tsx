'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoutButton from './LogoutButton'
import PublicHome from './PublicHome'
import PublicHeader from './PublicHeader'
import StaffViewSwitch from './StaffViewSwitch'
import type { PublicTravel } from '@/types/public-travel'
import Image from 'next/image'
import type {
  Booking,
  QuoteSnapshot,
  QuoteItem,
  Customer,
  CustomerType,
  TravelPart,
  Travel,
  TravelSelection,
  DestinationFee,
  OfferExtra,
  CustomerQuestionStatus,
  CustomerQuestion,
  VoyageVistaData,
} from '@/types/voyage'
import {
  acceptQuoteAction,
  addQuestionMessageAction,
  createQuestionAction,
  saveBookingAction,
  saveCustomerAction,
  saveQuoteAction,
  toggleFavoriteAction,
  updateQuestionAction,
} from '@/actions/voyage'
import Dialog from './Dialog'
import { BookingCheckout, TravelWishForm } from './CustomerForms'
import {
  calculateTravelPrice,
  dateOrderError,
  decimalRateError,
  isValidEmail,
  travelCapacityError,
  travellerError,
} from './travelRules'

function FieldError({ id, message }: { id: string; message: string }) {
  return message ? (
    <small id={id} className="field-error" role="alert">
      {message}
    </small>
  ) : null
}
function ErrorNotice({ message, children }: { message: string; children?: React.ReactNode }) {
  return message ? (
    <div className="validation-notice" role="alert">
      <b>Controleer je gegevens</b>
      <p>{message}</p>
      {children}
    </div>
  ) : null
}

function useMutation() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const run = async (
    action: () => Promise<import('@/actions/voyage').DataResult>,
    success?: (result: import('@/actions/voyage').DataResult) => void,
  ) => {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError('')
    try {
      const result = await action()
      if (!result.ok) {
        setError(result.message)
        return
      }
      success?.(result)
      router.refresh()
    } catch {
      setError(
        'De wijziging kon niet worden opgeslagen. Controleer je verbinding en probeer opnieuw.',
      )
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  return { run, pending, error }
}

function useBackendState<T>(backendValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(backendValue)

  useEffect(() => {
    setValue(backendValue)
  }, [backendValue])

  return [value, setValue]
}
function Documents({ booking, close }: { booking: Booking; close: () => void }) {
  return (
    <Dialog className="overlay" titleId="documents-title" onClose={close}>
      <section className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{booking.id}</p>
            <h2 id="documents-title">Reisdocumenten</h2>
          </div>
          <button aria-label="Sluiten" className="close" onClick={close}>
            ×
          </button>
        </div>
        <div className="form-content">
          <p>
            Er zijn nog geen reisdocumenten beschikbaar voor deze boeking. Neem contact op met je
            contactpersoon bij Voyage Vista.
          </p>
        </div>
      </section>
    </Dialog>
  )
}

type IconName =
  | 'home'
  | 'users'
  | 'map'
  | 'file'
  | 'calendar'
  | 'cpu'
  | 'search'
  | 'plus'
  | 'chevron'
  | 'bell'
  | 'check'
  | 'clock'
  | 'arrow'
  | 'more'
  | 'plane'
  | 'link'
  | 'shield'
  | 'menu'

const paths: Record<IconName, React.ReactNode> = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h9l5 5v15H6Z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3M10 10h4v4h-4z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  plane: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
}

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const nav = [
  { id: 'dashboard', label: 'Overzicht', icon: 'home' },
  { id: 'customers', label: 'Klantvragen', icon: 'users', count: 8 },
  { id: 'trips', label: 'Reizen', icon: 'map' },
  { id: 'quotes', label: 'Offertes', icon: 'file', count: 3 },
  { id: 'bookings', label: 'Boekingen', icon: 'calendar' },
] as const

const profileKey = (customer: Customer) => customer.id ?? customer.email
const findCustomer = (customers: Customer[], key?: string) => {
  if (!key) return undefined
  const exact = customers.find((customer) => customer.id === key)
  if (exact) return exact
  const matches = customers.filter((customer) => customer.email === key)
  return matches.length === 1 ? matches[0] : undefined
}
const getCustomerType = (key: string | undefined, customers: Customer[]): CustomerType =>
  findCustomer(customers, key)?.customerType ?? 'private'

const getDestinationFees = (
  travel: Travel,
  destinationFeeLabels: Record<string, Omit<DestinationFee, 'id'>>,
): DestinationFee[] => [
  {
    id: `${travel.id}-departure`,
    label: 'Luchthaven- en vertrekbelastingen',
    description: 'Verwerkt in de getoonde vlucht- en reissom.',
    unit: 'perPerson',
    payment: 'included',
  },
  {
    id: `${travel.id}-local`,
    ...(destinationFeeLabels[travel.country] ?? {
      label: 'Lokale verplichte heffingen',
      description: 'Tarief moet bij de lokale leverancier worden bevestigd.',
      unit: 'perPerson' as const,
      payment: 'local' as const,
    }),
  },
]

type QuoteAvailability = 'idle' | 'checking' | 'valid' | 'error' | 'price-change'
type QuoteDraftSession = {
  creating: boolean
  step: number
  selectedCustomer: Customer | null
  customerType: CustomerType
  customerQuery: string
  travellers: string
  budget: string
  selectedProposalId: string
  selectedParts: Record<string, boolean>
  partAlternatives: Record<string, number>
  selectedExtras: Record<string, boolean>
  availability: QuoteAvailability
  priceAdjustment: number
  pendingPriceChange: number
  vatRate: string
  localFeeRates: Record<string, string>
  generatedOffer: { number: string; status: string } | null
  editingQuoteNumber: string
  personalMessage?: string | null
}

let quoteDraftSession: QuoteDraftSession | null = null

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}

function Button({
  children,
  variant = 'primary',
  icon,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode
  variant?: string
  icon?: IconName
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button className={`button button-${variant}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

function Dashboard({
  goTo,
  openBooking,
}: {
  goTo: (id: string) => void
  openBooking: (booking: Booking) => void
}) {
  const { bookings, initialCustomerQuestions, quotes, user } = useVoyageData()
  const [bookingItems] = useBackendState(bookings)
  const [questionItems] = useBackendState(initialCustomerQuestions)
  const [quoteItems] = useBackendState(quotes)
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">SALES & BOEKINGEN</p>
          <h1>Welkom, {user.name.split(' ')[0]}</h1>
          <p>Dit speelt er vandaag binnen Sales & Boekingen.</p>
        </div>
        <Button icon="plus" onClick={() => goTo('quotes')}>
          Nieuwe offerte
        </Button>
      </section>

      <section className="metrics">
        <article className="metric">
          <div className="metric-icon coral">
            <Icon name="users" />
          </div>
          <p>Open klantvragen</p>
          <strong>{questionItems.filter((item) => item.status !== 'Afgesloten').length}</strong>
          <span className="trend">Openstaand in je werkruimte</span>
        </article>
        <article className="metric">
          <div className="metric-icon blue">
            <Icon name="file" />
          </div>
          <p>Actieve offertes</p>
          <strong>
            {quoteItems.filter((item) => ['Concept', 'Verstuurd'].includes(item.status)).length}
          </strong>
          <span>Concepten en verstuurde voorstellen</span>
        </article>
        <article className="metric">
          <div className="metric-icon green">
            <Icon name="calendar" />
          </div>
          <p>Actieve boekingen</p>
          <strong>{bookingItems.filter((item) => item.status !== 'Geannuleerd').length}</strong>
          <span className="trend positive">Actieve reserveringen</span>
        </article>
      </section>

      <section className="dashboard-grid single">
        <article className="panel">
          <div className="panel-title">
            <div>
              <h2>Recente boekingen</h2>
              <p>Je meest recente reserveringen.</p>
            </div>
            <button className="text-button" onClick={() => goTo('bookings')}>
              Alles bekijken <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Boeking</th>
                  <th>Klant</th>
                  <th>Reis</th>
                  <th>Bedrag</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!bookingItems.length && (
                  <tr>
                    <td colSpan={6}>Er zijn nog geen boekingen.</td>
                  </tr>
                )}
                {bookingItems.slice(0, 3).map((item) => (
                  <tr key={item.id} className="clickable" onClick={() => openBooking(item)}>
                    <td className="mono">
                      <button
                        className="text-button"
                        aria-label={`Bekijk boeking ${item.id}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openBooking(item)
                        }}
                      >
                        {item.id}
                      </button>
                    </td>
                    <td>
                      <b>{item.customer}</b>
                    </td>
                    <td>{item.trip}</td>
                    <td>
                      <b>{item.amount}</b>
                    </td>
                    <td>
                      <Badge
                        tone={
                          item.status === 'Bevestigd'
                            ? 'success'
                            : item.status === 'Optie'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td>
                      <Icon name="chevron" size={17} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower single">
        <article className="panel">
          <div className="panel-title">
            <div>
              <h2>Offertevoortgang</h2>
              <p>Verdeling per status</p>
            </div>
          </div>
          <div className="pipeline grid! grid-cols-2! gap-6! p-6! sm:grid-cols-4!">
            {['Concept', 'Verstuurd', 'Geaccepteerd', 'Afgewezen'].map((label, index) => {
              const value = quoteItems.filter((quote) => quote.status === label).length
              const width = `${quoteItems.length ? (value / quoteItems.length) * 100 : 0}%`
              return (
                <div className="pipeline-step min-w-0! max-sm:[&>svg]:hidden!" key={label}>
                  <div className="pipeline-top">
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                  <div className="bar">
                    <i style={{ width: String(width) }} />
                  </div>
                  {index < 3 && <Icon name="chevron" size={16} />}
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </>
  )
}

function BookingList({
  selected,
  setSelected,
}: {
  selected: Booking | null
  setSelected: (booking: Booking | null) => void
}) {
  const { bookings, customers, travelProposals } = useVoyageData()
  const mutation = useMutation()
  const [items, setItems] = useBackendState(bookings)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Booking | null>(null)
  const [documents, setDocuments] = useState<Booking | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const filtered = items.filter(
    (item) =>
      `${item.customer} ${item.trip} ${item.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (!status || item.status === status),
  )
  const active = selected ? (items.find((item) => item.id === selected.id) ?? selected) : null
  const save = () => {
    if (!editing) return
    void mutation.run(
      () => saveBookingAction(editing),
      () => {
        setSelected(null)
        setEditing(null)
      },
    )
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">SALES & BOEKINGEN</p>
          <h1>Boekingen</h1>
          <p>Beheer alle reserveringen vanuit één overzicht.</p>
        </div>
        <Button
          icon="plus"
          disabled={!customers.length || !travelProposals.length || mutation.pending}
          onClick={() =>
            setEditing({
              id: `VV-${Date.now().toString().slice(-7)}`,
              customer: customers[0]?.name ?? '',
              customerId: customers[0]?.id,
              trip: travelProposals[0].title,
              date: travelProposals[0].dates,
              amount: formatTravelPrice(getTravelPricePerPerson(travelProposals[0], 2) * 2),
              status: 'Optie',
            })
          }
        >
          Nieuwe boeking
        </Button>
      </section>
      <ErrorNotice message={mutation.error} />
      <section className="panel content-panel">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input
              aria-label="Boekingen zoeken"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPageIndex(0)
              }}
              placeholder="Zoek op klant, reis of boekingsnummer"
            />
          </div>
          <select
            aria-label="Boekingsstatus"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPageIndex(0)
            }}
          >
            <option value="">Alle statussen</option>
            {['Bevestigd', 'Wacht op betaling', 'Optie', 'Geannuleerd'].map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('')
              setQuery('')
              setPageIndex(0)
            }}
          >
            Filters wissen
          </Button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Boekingsnummer', 'Klant', 'Reis', 'Reisdata', 'Bedrag', 'Status', ''].map(
                  (label, index) => (
                    <th key={index}>{label}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(pageIndex * 8, pageIndex * 8 + 8).map((item) => (
                <tr key={item.id} className="clickable" onClick={() => setSelected(item)}>
                  <td className="mono">{item.id}</td>
                  <td>
                    <b>{item.customer}</b>
                  </td>
                  <td>{item.trip}</td>
                  <td>{item.date}</td>
                  <td>
                    <b>{item.amount}</b>
                  </td>
                  <td>
                    <Badge tone={item.status === 'Bevestigd' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      aria-label={`Open ${item.id}`}
                      onClick={() => setSelected(item)}
                    >
                      <Icon name="chevron" />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7}>Geen boekingen gevonden. Pas je zoekopdracht aan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            {filtered.length
              ? `${pageIndex * 8 + 1}–${Math.min(pageIndex * 8 + 8, filtered.length)}`
              : '0'}{' '}
            van {filtered.length} boekingen
          </span>
          <div>
            <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>
              Vorige
            </button>
            <button
              disabled={(pageIndex + 1) * 8 >= filtered.length}
              onClick={() => setPageIndex(pageIndex + 1)}
            >
              Volgende
            </button>
          </div>
        </div>
      </section>
      {active && !editing && !documents && (
        <Dialog className="overlay" titleId="dialog-title-665" onClose={() => setSelected(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">{active.id}</p>
                <h2 id="dialog-title-665">{active.trip}</h2>
              </div>
              <button aria-label="Sluiten" className="close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="trip-banner">
              <Icon name="plane" size={28} />
              <div>
                <small>Reiziger</small>
                <b>{active.customer}</b>
              </div>
              <Badge tone={active.status === 'Bevestigd' ? 'success' : 'warning'}>
                {active.status}
              </Badge>
            </div>
            <div className="detail-grid">
              <div>
                <small>Reisperiode</small>
                <b>{active.date}</b>
              </div>
              <div>
                <small>Reissom</small>
                <b>{active.amount}</b>
              </div>
              <div>
                <small>Betaling</small>
                <b>{active.status === 'Bevestigd' ? 'Voldaan' : 'Nog niet voldaan'}</b>
              </div>
            </div>
            <h3>Volgende stappen</h3>
            <p>
              Controleer de reisgegevens en de betaling. De boekingsbevestiging en het reisoverzicht
              staan bij documenten.
            </p>
            <div className="drawer-actions">
              <Button variant="secondary" onClick={() => setEditing({ ...active })}>
                Boeking wijzigen
              </Button>
              <Button onClick={() => setDocuments(active)}>Documenten bekijken</Button>
            </div>
          </aside>
        </Dialog>
      )}
      {editing && (
        <Dialog className="overlay" titleId="dialog-title-721" onClose={() => setEditing(null)}>
          <form
            className="modal"
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <div className="modal-head">
              <h2 id="dialog-title-721">
                Boeking {items.some((item) => item.id === editing.id) ? 'wijzigen' : 'toevoegen'}
              </h2>
              <button
                aria-label="Sluiten"
                type="button"
                className="close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>
            <div className="form-content">
              <ErrorNotice message={mutation.error} />
              <label>
                Klant
                <select
                  value={editing.customerId ?? editing.customer}
                  onChange={(event) => {
                    const customer = findCustomer(customers, event.target.value)
                    if (customer)
                      setEditing({ ...editing, customer: customer.name, customerId: customer.id })
                  }}
                >
                  {customers.map((customer) => (
                    <option key={profileKey(customer)} value={profileKey(customer)}>
                      {customer.name} · {customer.email}
                      {customer.accountProfile ? ' · App-account' : ''} · {customer.id?.slice(-6)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reis
                <select
                  value={editing.trip}
                  onChange={(event) => {
                    const travel = travelProposals.find(
                      (travel) => travel.title === event.target.value,
                    )!
                    setEditing({
                      ...editing,
                      trip: travel.title,
                      date: travel.dates,
                      amount: formatTravelPrice(getTravelTotal(travel, 2)),
                    })
                  }}
                >
                  <option>{editing.trip}</option>
                  {travelProposals
                    .filter((travel) => travel.available && travel.title !== editing.trip)
                    .map((travel) => (
                      <option key={travel.id}>{travel.title}</option>
                    ))}
                </select>
              </label>
              <label>
                Reisperiode
                <input
                  required
                  value={editing.date}
                  onChange={(event) => setEditing({ ...editing, date: event.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={editing.status}
                  onChange={(event) => setEditing({ ...editing, status: event.target.value })}
                >
                  {['Optie', 'Wacht op betaling', 'Bevestigd', 'Geannuleerd'].map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </label>
              <p>
                Reissom: <b>{editing.amount}</b>
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditing(null)}
              >
                Annuleren
              </button>
              <button type="submit" className="button button-primary" disabled={mutation.pending}>
                Boeking opslaan
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {documents && <Documents booking={documents} close={() => setDocuments(null)} />}
    </>
  )
}

function Quotes({
  initialSelection,
  clearInitialSelection,
  openNew,
  clearOpenNew,
}: {
  initialSelection: TravelSelection | null
  clearInitialSelection: () => void
  openNew: boolean
  clearOpenNew: () => void
}) {
  const { quotes, customers, travelWishes, travelProposals, destinationFeeLabels, offerExtras } =
    useVoyageData()
  const mutation = useMutation()
  const [quoteItems, setQuoteItems] = useBackendState(quotes)
  const [customerOptions, setCustomerOptions] = useBackendState(customers)
  const [creating, setCreating] = useState(() => quoteDraftSession?.creating ?? false)
  const [step, setStep] = useState(() => quoteDraftSession?.step ?? 1)
  const [customerQuery, setCustomerQuery] = useState(() => quoteDraftSession?.customerQuery ?? '')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    () => quoteDraftSession?.selectedCustomer ?? null,
  )
  const [customerType, setCustomerType] = useState<CustomerType>(
    () => quoteDraftSession?.customerType ?? 'private',
  )
  const [travellers, setTravellers] = useState(() => quoteDraftSession?.travellers ?? '')
  const [budget, setBudget] = useState(() => quoteDraftSession?.budget ?? '')
  const [personalMessage, setPersonalMessage] = useState<string | null>(
    () => quoteDraftSession?.personalMessage ?? null,
  )
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' })
  const [selectedProposalId, setSelectedProposalId] = useState(
    () => quoteDraftSession?.selectedProposalId ?? '',
  )
  const [proposalDestination, setProposalDestination] = useState('')
  const [selectedParts, setSelectedParts] = useState<Record<string, boolean>>(
    () => quoteDraftSession?.selectedParts ?? {},
  )
  const [partAlternatives, setPartAlternatives] = useState<Record<string, number>>(
    () => quoteDraftSession?.partAlternatives ?? {},
  )
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>(
    () => quoteDraftSession?.selectedExtras ?? {},
  )
  const [availability, setAvailability] = useState<QuoteAvailability>(
    () => quoteDraftSession?.availability ?? 'idle',
  )
  const [priceAdjustment, setPriceAdjustment] = useState(
    () => quoteDraftSession?.priceAdjustment ?? 0,
  )
  const [pendingPriceChange, setPendingPriceChange] = useState(
    () => quoteDraftSession?.pendingPriceChange ?? 0,
  )
  const [vatRate, setVatRate] = useState(() => quoteDraftSession?.vatRate ?? '21')
  const [localFeeRates, setLocalFeeRates] = useState<Record<string, string>>(
    () => quoteDraftSession?.localFeeRates ?? {},
  )
  const [generatedOffer, setGeneratedOffer] = useState<{ number: string; status: string } | null>(
    () => quoteDraftSession?.generatedOffer ?? null,
  )
  const [editingQuoteNumber, setEditingQuoteNumber] = useState(
    () => quoteDraftSession?.editingQuoteNumber ?? '',
  )
  const sending = mutation.pending
  const [sendError, setSendError] = useState('')
  const selectedProposal =
    travelProposals.find((proposal) => proposal.id === selectedProposalId) ?? null
  const matchingCustomers = customerOptions.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.phone}`
      .toLowerCase()
      .includes(customerQuery.toLowerCase()),
  )
  const countError = travellerError(travellers)
  const travellerCount = countError ? 0 : Number(travellers)
  const capacityError = selectedProposal ? travelCapacityError(selectedProposal, travellers) : ''
  const vatError = decimalRateError(vatRate, 'vat')
  const feeErrors = Object.fromEntries(
    (selectedProposal ? getDestinationFees(selectedProposal, destinationFeeLabels) : [])
      .filter((fee) => fee.payment === 'local')
      .map((fee) => [fee.id, decimalRateError(localFeeRates[fee.id] ?? '', 'local')]),
  )
  const taxesValid = !vatError && Object.values(feeErrors).every((error) => !error)
  const getPartChoice = (part: (typeof travelProposals)[number]['parts'][number]) => {
    const alternativeIndex = partAlternatives[part.id] ?? -1
    return alternativeIndex >= 0 && part.alternatives?.[alternativeIndex]
      ? part.alternatives[alternativeIndex]
      : { label: part.label, price: part.price, available: part.available !== false }
  }
  const { partsTotal, extrasTotal, serviceCosts, totalPrice } = calculateTravelPrice(
    selectedProposal,
    travellerCount,
    {
      parts: selectedParts,
      alternatives: partAlternatives,
      extras: offerExtras.filter((extra) => selectedExtras[extra.id]),
      priceAdjustment,
    },
  )
  const effectiveVatRate = Number(vatRate) / 100
  const vatAmount = vatError
    ? null
    : effectiveVatRate > 0
      ? Math.round(totalPrice - totalPrice / (1 + effectiveVatRate))
      : 0
  const totalExcludingVat = vatAmount === null ? null : totalPrice - vatAmount
  const destinationFees = selectedProposal
    ? getDestinationFees(selectedProposal, destinationFeeLabels)
    : []
  const localDestinationFee = destinationFees.find((fee) => fee.payment === 'local')
  const localFeeRate = Number(localDestinationFee ? localFeeRates[localDestinationFee.id] : 0) || 0
  const localFeeKnown = Boolean(
    localDestinationFee &&
    (localFeeRates[localDestinationFee.id] ?? '').trim() &&
    !feeErrors[localDestinationFee.id],
  )
  const localFeeUnits =
    localDestinationFee?.unit === 'perPersonNight'
      ? travellerCount * Math.max((selectedProposal?.duration ?? 1) - 1, 1)
      : travellerCount
  const localFeeEstimate =
    localDestinationFee && feeErrors[localDestinationFee.id] ? null : localFeeRate * localFeeUnits
  const formatPrice = (amount: number | null) =>
    amount === null
      ? '—'
      : new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(amount)
  const budgetLimit = getBudgetLimit(budget)
  const budgetExceededBy =
    budgetLimit !== null && totalPrice > budgetLimit ? totalPrice - budgetLimit : 0
  const capacityAvailable = Boolean(selectedProposal && !capacityError)
  const effectiveMessage = useMemo(
    () =>
      personalMessage ??
      (selectedCustomer && selectedProposal
        ? `Hoi ${selectedCustomer.name.split(' ')[0]}, hierbij vind je ons voorstel voor ${selectedProposal.title}. Laat gerust weten als je iets wilt aanpassen!`
        : ''),
    [personalMessage, selectedCustomer?.name, selectedProposal?.title],
  )
  const selectedPartsAvailable =
    selectedProposal?.parts.every(
      (part) =>
        (!part.required || Boolean(selectedParts[part.id])) &&
        (!selectedParts[part.id] || getPartChoice(part).available),
    ) ?? false
  const offerChecks = [
    { label: 'Klant geselecteerd', valid: Boolean(selectedCustomer) },
    {
      label: 'Geldig e-mailadres',
      valid: Boolean(selectedCustomer && isValidEmail(selectedCustomer.email)),
    },
    { label: 'Aantal reizigers gecontroleerd', valid: !countError },
    { label: 'BTW en lokale heffingen geldig', valid: taxesValid },
    {
      label: 'Reis en verplichte onderdelen beschikbaar',
      valid: Boolean(selectedProposal?.available && selectedPartsAvailable && capacityAvailable),
    },
    { label: 'Prijs en beschikbaarheid bevestigd', valid: availability === 'valid' },
  ]
  const canGenerateOffer = offerChecks.every((check) => check.valid)

  useEffect(() => {
    if (!initialSelection) return
    setCreating(true)
    setPersonalMessage(null)
    setEditingQuoteNumber('')
    setStep(1)
    setSelectedProposalId(initialSelection.travelId)
    setProposalDestination('')
    setTravellers(String(initialSelection.travellers))
    const transferredCustomer =
      findCustomer(
        customerOptions,
        initialSelection.customerId ?? initialSelection.customerEmail,
      ) ?? null
    setSelectedCustomer(transferredCustomer)
    setCustomerType(
      getCustomerType(transferredCustomer ? profileKey(transferredCustomer) : undefined, customers),
    )
    setCustomerQuery(transferredCustomer?.name ?? '')
    setBudget(initialSelection.budget ?? '')
    const proposal = travelProposals.find((item) => item.id === initialSelection.travelId)
    setSelectedParts(
      Object.fromEntries(
        (proposal?.parts ?? []).map((part) => [part.id, part.defaultSelected || part.required]),
      ),
    )
    const availableAlternatives = Object.fromEntries(
      (proposal?.parts ?? []).flatMap((part) => {
        if (part.available !== false) return []
        const alternativeIndex =
          part.alternatives?.findIndex((alternative) => alternative.available) ?? -1
        return alternativeIndex >= 0 ? [[part.id, alternativeIndex]] : []
      }),
    )
    setPartAlternatives(availableAlternatives)
    setSelectedExtras({})
    setVatRate('21')
    setLocalFeeRates({})
    const partsAvailable = (proposal?.parts ?? []).every(
      (part) =>
        !(part.defaultSelected || part.required) ||
        part.available !== false ||
        (part.alternatives?.some((alternative) => alternative.available) ?? false),
    )
    const capacityAvailable = !travelCapacityError(proposal ?? null, initialSelection.travellers)
    setPriceAdjustment(0)
    if (!proposal?.available || !partsAvailable || !capacityAvailable) {
      setPendingPriceChange(0)
      setAvailability('error')
    } else {
      setPendingPriceChange(0)
      setAvailability('valid')
    }
    setGeneratedOffer(null)
    clearInitialSelection()
  }, [initialSelection, clearInitialSelection])

  useEffect(() => {
    quoteDraftSession = {
      creating,
      step,
      selectedCustomer,
      customerType,
      customerQuery,
      travellers,
      budget,
      selectedProposalId,
      selectedParts,
      partAlternatives,
      selectedExtras,
      availability,
      priceAdjustment,
      pendingPriceChange,
      vatRate,
      localFeeRates,
      generatedOffer,
      editingQuoteNumber,
      personalMessage,
    }
  }, [
    creating,
    step,
    selectedCustomer,
    customerType,
    customerQuery,
    travellers,
    budget,
    selectedProposalId,
    selectedParts,
    partAlternatives,
    selectedExtras,
    availability,
    priceAdjustment,
    pendingPriceChange,
    vatRate,
    localFeeRates,
    generatedOffer,
    editingQuoteNumber,
    personalMessage,
  ])

  const startCreating = () => {
    setPersonalMessage(null)
    setStep(1)
    setCustomerQuery('')
    setSelectedCustomer(null)
    setCustomerType('private')
    setTravellers('')
    setBudget('')
    setAddingCustomer(false)
    setNewCustomer({ name: '', email: '', phone: '' })
    setSelectedProposalId('')
    setProposalDestination('')
    setSelectedParts({})
    setPartAlternatives({})
    setSelectedExtras({})
    setAvailability('idle')
    setPriceAdjustment(0)
    setPendingPriceChange(0)
    setLocalFeeRates({})
    setVatRate('21')
    setLocalFeeRates({})
    setGeneratedOffer(null)
    setEditingQuoteNumber('')
    setSendError('')
    setCreating(true)
  }

  useEffect(() => {
    if (!editingQuoteNumber || personalMessage === null) return
    setQuoteItems((current) =>
      current.map((quote) =>
        quote.number === editingQuoteNumber && quote.status === 'Concept' && quote.snapshot
          ? { ...quote, snapshot: { ...quote.snapshot, personalMessage } }
          : quote,
      ),
    )
  }, [editingQuoteNumber, personalMessage])

  const chooseCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerType(getCustomerType(profileKey(customer), customers))
    setCustomerQuery(customer.name)
    const wish = travelWishes[profileKey(customer)]
    setBudget(wish?.budget ?? '')
    if (!selectedProposalId) {
      setTravellers(wish ? String(wish.travellers) : '')
      selectProposal(wish?.proposalId ?? '')
    }
  }

  useEffect(() => {
    if (openNew) {
      startCreating()
      clearOpenNew()
    }
  }, [openNew])

  const addCustomer = () => {
    if (!newCustomer.name.trim() || !isValidEmail(newCustomer.email) || !newCustomer.phone.trim())
      return
    const customer: Customer = {
      ...newCustomer,
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim(),
    }
    void mutation.run(
      () => saveCustomerAction(customer),
      (result) => {
        customer.id = result.reference
        setCustomerOptions((current) => [customer, ...current])
        chooseCustomer(customer)
        setAddingCustomer(false)
      },
    )
  }

  const selectProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId)
    const proposal = travelProposals.find((item) => item.id === proposalId)
    setSelectedParts(
      Object.fromEntries(
        (proposal?.parts ?? []).map((part) => [part.id, part.defaultSelected || part.required]),
      ),
    )
    setPartAlternatives({})
    setSelectedExtras({})
    setAvailability('idle')
    setPriceAdjustment(0)
    setPendingPriceChange(0)
  }

  const toggleExtra = (id: string) => {
    setSelectedExtras((current) => ({ ...current, [id]: !current[id] }))
    setAvailability('idle')
  }

  const togglePart = (id: string) => {
    const part = selectedProposal?.parts.find((item) => item.id === id)
    if (!part || part.required) return
    setSelectedParts((current) => ({ ...current, [id]: !current[id] }))
    setAvailability('idle')
  }

  const changePartAlternative = (id: string) => {
    const part = selectedProposal?.parts.find((item) => item.id === id)
    if (!part?.alternatives?.length) return
    const current = partAlternatives[id] ?? -1
    setPartAlternatives((alternatives) => ({
      ...alternatives,
      [id]: current + 1 >= part.alternatives!.length ? -1 : current + 1,
    }))
    setSelectedParts((parts) => ({ ...parts, [id]: true }))
    setAvailability('idle')
    setPriceAdjustment(0)
  }

  const checkAvailability = () => {
    if (countError || capacityError || !taxesValid) {
      setAvailability('error')
      return
    }
    const invalidPart = selectedProposal?.parts.some(
      (part) => selectedParts[part.id] && !getPartChoice(part).available,
    )
    setAvailability(
      travelCapacityError(selectedProposal, travellers) || invalidPart || !selectedPartsAvailable
        ? 'error'
        : 'valid',
    )
  }

  const confirmPriceChange = () => {
    if (countError || capacityError || !taxesValid || !selectedPartsAvailable) {
      setAvailability('error')
      return
    }
    setPriceAdjustment(pendingPriceChange)
    setPendingPriceChange(0)
    setAvailability('valid')
  }

  const currentSnapshot = (): QuoteSnapshot => ({
    customerId: selectedCustomer?.id,
    customerEmail: selectedCustomer?.email ?? '',
    customerType,
    travellers,
    budget,
    proposalId: selectedProposalId,
    parts: selectedParts,
    alternatives: partAlternatives,
    extras: selectedExtras,
    priceAdjustment,
    vatRate: Number(vatRate) || 0,
    localFeeRates,
    personalMessage: effectiveMessage,
  })

  const createOffer = () => {
    if (!canGenerateOffer || !selectedCustomer || !selectedProposal) return
    const number =
      editingQuoteNumber || `OFF-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
    const item: QuoteItem = {
      number,
      customer: selectedCustomer.name,
      destination: selectedProposal.destination,
      amount: formatPrice(totalPrice),
      time: 'Zojuist',
      status: 'Concept',
      snapshot: currentSnapshot(),
    }
    void mutation.run(
      () => saveQuoteAction(item),
      () => {
        setGeneratedOffer({ number, status: 'Concept' })
        setQuoteItems((current) => [...current.filter((quote) => quote.number !== number), item])
        setEditingQuoteNumber(number)
      },
    )
  }

  const updateGeneratedStatus = (status: string) => {
    if (!generatedOffer) return
    const item = quoteItems.find((quote) => quote.number === generatedOffer.number)
    if (!item) return
    void mutation.run(
      () => saveQuoteAction({ ...item, status, snapshot: currentSnapshot() }),
      () => {
        setGeneratedOffer({ ...generatedOffer, status })
        setQuoteItems((current) =>
          current.map((quote) => (quote.number === item.number ? { ...quote, status } : quote)),
        )
      },
    )
  }

  const openQuote = (quote: QuoteItem) => {
    const customer = findCustomer(
      customerOptions,
      quote.customerId ?? quote.snapshot?.customerId ?? quote.snapshot?.customerEmail,
    )
    const proposal =
      travelProposals.find((item) => item.id === quote.snapshot?.proposalId) ??
      travelProposals.find((item) => quote.destination.includes(item.destination.split(',')[0])) ??
      travelProposals[0]
    if (!customer || !proposal) return
    const snapshot = quote.snapshot
    const wish = travelWishes[profileKey(customer)]
    setSelectedCustomer(customer)
    setCustomerType(snapshot?.customerType ?? getCustomerType(profileKey(customer), customers))
    setCustomerQuery(customer.name)
    setTravellers(snapshot?.travellers ?? String(wish?.travellers ?? 2))
    setBudget(snapshot?.budget ?? wish?.budget ?? '')
    setSelectedProposalId(proposal.id)
    setSelectedParts(
      snapshot?.parts ??
        Object.fromEntries(
          proposal.parts.map((part) => [part.id, part.defaultSelected || part.required]),
        ),
    )
    setPartAlternatives(snapshot?.alternatives ?? {})
    setSelectedExtras(snapshot?.extras ?? {})
    setPriceAdjustment(snapshot?.priceAdjustment ?? 0)
    setVatRate(String(snapshot?.vatRate ?? 21))
    setLocalFeeRates(snapshot?.localFeeRates ?? {})
    setPersonalMessage(snapshot?.personalMessage ?? null)
    setAvailability('valid')
    setGeneratedOffer({ number: quote.number, status: quote.status })
    setEditingQuoteNumber(quote.number)
    setStep(3)
    setSendError('')
    setCreating(true)
  }

  const downloadOffer = () => {
    if (!generatedOffer || !selectedCustomer || !selectedProposal) return
    const content = [
      `Voyage Vista — Offerte ${generatedOffer.number}`,
      `Status: ${generatedOffer.status}`,
      `Klant: ${selectedCustomer.name}`,
      `E-mail: ${selectedCustomer.email}`,
      `Reis: ${selectedProposal.title}`,
      `Periode: ${selectedProposal.dates}`,
      `Reizigers: ${travellers}`,
      '',
      effectiveMessage,
      '',
      `Klanttype: ${customerType === 'business' ? 'Zakelijk' : 'Particulier'}`,
      customerType === 'business'
        ? `Subtotaal excl. BTW: ${formatPrice(totalExcludingVat)}`
        : `BTW inbegrepen: ${formatPrice(vatAmount)}`,
      `BTW (${vatRate || '0'}%): ${formatPrice(vatAmount)}`,
      '',
      'Reisonderdelen:',
      ...selectedProposal.parts
        .filter((part) => selectedParts[part.id])
        .map(
          (part) =>
            `- ${getPartChoice(part).label}: ${formatPrice(getPartChoice(part).price * (part.perPerson ? travellerCount : 1))}`,
        ),
      ...offerExtras
        .filter((extra) => selectedExtras[extra.id])
        .map(
          (extra) =>
            `- ${extra.label}: ${formatPrice(extra.price * (extra.perPerson ? travellerCount : 1))}`,
        ),
      `Servicekosten: ${formatPrice(serviceCosts)}`,
      `Totale reissom: ${formatPrice(totalPrice)}`,
      localDestinationFee
        ? `${localDestinationFee.label}: ${localFeeKnown ? `${formatPrice(localFeeEstimate)} ter plaatse` : 'tarief nog te bevestigen, ter plaatse te betalen'}`
        : '',
    ].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    link.download = `${generatedOffer.number}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const sendOffer = () => {
    if (!selectedCustomer || !isValidEmail(selectedCustomer.email)) {
      setSendError('Controleer het e-mailadres van de klant voordat je verstuurt.')
      return
    }
    setSendError('')
    updateGeneratedStatus('Verstuurd')
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">SALES & BOEKINGEN</p>
          <h1>Offertes</h1>
          <p>Stel reisvoorstellen samen en volg de status.</p>
        </div>
        <Button icon="plus" onClick={startCreating}>
          Nieuwe offerte
        </Button>
      </section>
      <ErrorNotice message={mutation.error} />
      <section className="quote-board">
        {['Concept', 'Verstuurd', 'Geaccepteerd'].map((status) => (
          <div className="quote-column" key={status}>
            <div className="column-head">
              <h2>{status}</h2>
              <span>{quoteItems.filter((q) => q.status === status).length}</span>
            </div>
            {quoteItems
              .filter((q) => q.status === status)
              .map((q) => (
                <article
                  className="quote-card clickable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Offerte ${q.number} voor ${q.customer} openen`}
                  onClick={() => openQuote(q)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openQuote(q)
                    }
                  }}
                  key={q.number}
                >
                  <Badge
                    tone={
                      status === 'Geaccepteerd'
                        ? 'success'
                        : status === 'Verstuurd'
                          ? 'info'
                          : 'neutral'
                    }
                  >
                    {status}
                  </Badge>
                  <h3>{q.destination}</h3>
                  <p>
                    {q.customer} · {q.number}
                  </p>
                  <div>
                    <b>{q.amount}</b>
                    <small>{q.time}</small>
                  </div>
                </article>
              ))}
          </div>
        ))}
      </section>
      {creating && (
        <div className="overlay">
          <Dialog
            className="modal offer-modal"
            titleId="offer-dialog-title"
            onClose={() => setCreating(false)}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">
                  {generatedOffer ? generatedOffer.number : 'NIEUWE OFFERTE'}
                </p>
                <h2 id="offer-dialog-title">
                  {generatedOffer
                    ? 'Offertevoorbeeld'
                    : step === 1
                      ? 'Voor wie is de reis?'
                      : step === 2
                        ? 'Controleer de gekozen reis'
                        : 'Controleer de offerte'}
                </h2>
              </div>
              <div className="modal-head-actions">
                <span className="autosave-status">
                  <Icon name={generatedOffer ? 'check' : 'clock'} size={14} />
                  {generatedOffer ? 'Offerte opgeslagen' : 'Invoer nog niet opgeslagen'}
                </span>
              </div>
            </div>
            {!generatedOffer && (
              <div className="steps">
                {['Klant', 'Reis', 'Controle'].map((label, i) => (
                  <div className={step >= i + 1 ? 'active' : ''} key={label}>
                    <span>{step > i + 1 ? <Icon name="check" size={13} /> : i + 1}</span>
                    {label}
                  </div>
                ))}{' '}
              </div>
            )}
            <div className="quote-context-bar">
              <div>
                <small>Klant</small>
                <b>{selectedCustomer?.name ?? 'Nog niet gekozen'}</b>
              </div>
              <div>
                <small>Reis</small>
                <b>{selectedProposal?.title ?? 'Nog niet gekozen'}</b>
              </div>
              <div>
                <small>Reizigers</small>
                <b>{travellers || '—'}</b>
              </div>
              <div className={budgetExceededBy > 0 ? 'over-budget' : ''}>
                <small>Budget</small>
                <b>{budget || 'Niet ingesteld'}</b>
              </div>
              <div>
                <small>Totaal</small>
                <strong>{selectedProposal ? formatPrice(totalPrice) : '—'}</strong>
              </div>
              <Badge
                tone={
                  availability === 'valid'
                    ? 'success'
                    : availability === 'error' || availability === 'price-change'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {availability === 'valid'
                  ? 'Gecontroleerd'
                  : availability === 'error'
                    ? 'Actie nodig'
                    : availability === 'price-change'
                      ? 'Prijs bevestigen'
                      : 'Nog controleren'}
              </Badge>
            </div>
            <div className="form-content">
              <ErrorNotice message={mutation.error} />
              {!generatedOffer && (
                <ErrorNotice
                  message={
                    capacityError ||
                    (!taxesValid
                      ? 'Controleer de gemarkeerde BTW en lokale heffingen in stap 2.'
                      : '')
                  }
                >
                  {step !== 1 && capacityError && (
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      Aantal reizigers aanpassen
                    </Button>
                  )}
                  {capacityError && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        selectProposal('')
                        setStep(2)
                      }}
                    >
                      Andere reis kiezen
                    </Button>
                  )}
                </ErrorNotice>
              )}
              {!generatedOffer && step === 1 && (
                <>
                  <div className="form-section-title">
                    <div>
                      <h3>Klant selecteren</h3>
                      <p>Zoek een bestaande klant of voeg een nieuwe klant toe.</p>
                    </div>
                    <button
                      className="inline-action"
                      onClick={() => setAddingCustomer(!addingCustomer)}
                    >
                      <Icon name="plus" size={15} /> Nieuwe klant toevoegen
                    </button>
                  </div>
                  {addingCustomer && (
                    <div className="new-customer-form">
                      <label>
                        Naam
                        <input
                          value={newCustomer.name}
                          onChange={(event) =>
                            setNewCustomer({ ...newCustomer, name: event.target.value })
                          }
                          placeholder="Voor- en achternaam"
                        />
                      </label>
                      <label>
                        E-mail
                        <input
                          type="email"
                          value={newCustomer.email}
                          aria-invalid={Boolean(
                            newCustomer.email && !isValidEmail(newCustomer.email),
                          )}
                          aria-describedby="quote-email-error"
                          onChange={(event) =>
                            setNewCustomer({ ...newCustomer, email: event.target.value })
                          }
                          placeholder="naam@email.nl"
                        />
                        <FieldError
                          id="quote-email-error"
                          message={
                            newCustomer.email && !isValidEmail(newCustomer.email)
                              ? 'Vul een geldig e-mailadres in, bijvoorbeeld naam@example.nl.'
                              : ''
                          }
                        />
                      </label>
                      <label>
                        Telefoonnummer
                        <input
                          value={newCustomer.phone}
                          onChange={(event) =>
                            setNewCustomer({ ...newCustomer, phone: event.target.value })
                          }
                          placeholder="06 12 34 56 78"
                        />
                      </label>
                      <div>
                        <Button variant="secondary" onClick={() => setAddingCustomer(false)}>
                          Annuleren
                        </Button>
                        <Button
                          disabled={
                            !newCustomer.name.trim() ||
                            !isValidEmail(newCustomer.email) ||
                            !newCustomer.phone.trim()
                          }
                          onClick={addCustomer}
                        >
                          Klant toevoegen
                        </Button>
                      </div>
                    </div>
                  )}
                  {!addingCustomer && (
                    <label>
                      Klant zoeken
                      <div className="search wide">
                        <Icon name="search" />
                        <input
                          value={customerQuery}
                          onChange={(event) => {
                            setCustomerQuery(event.target.value)
                            setSelectedCustomer(null)
                          }}
                          placeholder="Zoek op naam, e-mail of telefoonnummer"
                        />
                      </div>
                    </label>
                  )}
                  {!addingCustomer && !selectedCustomer && (
                    <div className="customer-picker">
                      <div className="customer-picker-head">
                        <span>{matchingCustomers.length} klanten</span>
                        <small>Selecteer één klant</small>
                      </div>
                      {matchingCustomers.map((customer) => (
                        <button key={profileKey(customer)} onClick={() => chooseCustomer(customer)}>
                          <span>
                            {customer.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <div>
                            <b>{customer.name}</b>
                            <small>
                              {customer.email} · {customer.phone} ·{' '}
                              {getCustomerType(profileKey(customer), customers) === 'business'
                                ? 'Zakelijk'
                                : 'Particulier'}
                              {customer.accountProfile ? ' · App-account' : ' · Bestaand dossier'} ·{' '}
                              {customer.id?.slice(-6)}
                            </small>
                          </div>
                          <Icon name="chevron" size={16} />
                        </button>
                      ))}
                      {matchingCustomers.length === 0 && (
                        <p className="empty-customers">
                          Geen klanten gevonden. Probeer een andere zoekterm of voeg een klant toe.
                        </p>
                      )}
                    </div>
                  )}
                  {selectedCustomer && (
                    <div className="customer-result">
                      <span>
                        {selectedCustomer.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <div>
                        <b>{selectedCustomer.name}</b>
                        <small>
                          {selectedCustomer.email} · {selectedCustomer.phone}
                        </small>
                      </div>
                      <button
                        className="change-customer"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setCustomerQuery('')
                          setCustomerType('private')
                        }}
                      >
                        Wijzigen
                      </button>
                    </div>
                  )}
                  <div className="customer-type-selector">
                    <label>
                      Boekingstype
                      <select
                        value={customerType}
                        onChange={(event) => setCustomerType(event.target.value as CustomerType)}
                      >
                        <option value="private">Particuliere klant</option>
                        <option value="business">Zakelijke klant</option>
                      </select>
                    </label>
                    <p>
                      {customerType === 'business'
                        ? 'BTW wordt afzonderlijk gespecificeerd. Aftrekbaarheid is afhankelijk van de fiscale voorwaarden.'
                        : 'BTW is niet aftrekbaar en is opgenomen in de totale reissom.'}
                    </p>
                  </div>
                  {selectedProposal && (
                    <div className="selected-trip-head transferred-trip-summary">
                      <div>
                        <p className="eyebrow">GEKOZEN REIS</p>
                        <h3>{selectedProposal.title}</h3>
                        <p>
                          {selectedProposal.destination} · {selectedProposal.dates} ·{' '}
                          {travellers || '—'} {travellerCount === 1 ? 'reiziger' : 'reizigers'}
                        </p>
                      </div>
                      <Badge tone="success">Overgenomen</Badge>
                    </div>
                  )}
                  {budgetExceededBy > 0 && (
                    <div className="budget-warning">
                      <Icon name="clock" size={17} />
                      <div>
                        <b>
                          Deze reis is {formatPrice(budgetExceededBy)} duurder dan het klantbudget
                        </b>
                        <small>
                          De controle is automatisch uitgevoerd op basis van het totale
                          reisgezelschap.
                        </small>
                      </div>
                    </div>
                  )}
                  <div className="form-row">
                    <label>
                      Aantal reizigers
                      <input
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        aria-invalid={Boolean(countError)}
                        aria-describedby="quote-travellers-error"
                        value={travellers}
                        placeholder="Vul een aantal in"
                        onChange={(event) => {
                          const value = event.target.value
                          setTravellers(value)
                          setAvailability('idle')
                          setPriceAdjustment(0)
                          setPendingPriceChange(0)
                        }}
                      />
                      <FieldError id="quote-travellers-error" message={countError} />
                      <small className="field-hint">
                        {selectedProposal
                          ? 'Overgenomen uit de zoekopdracht'
                          : travelWishes[selectedCustomer ? profileKey(selectedCustomer) : '']
                            ? 'Overgenomen uit de reiswens'
                            : 'Vul 1 t/m 20 reizigers in'}
                      </small>
                    </label>
                    <label>
                      Gewenst budget
                      <select value={budget} onChange={(event) => setBudget(event.target.value)}>
                        <option value="">Kies een budget</option>
                        {budget &&
                          ![
                            '€ 0 – € 500',
                            '€ 500 – € 1.000',
                            '€ 1.000 – € 1.500',
                            '€ 1.500 – € 2.000',
                            '€ 2.000+',
                          ].includes(budget) && <option value={budget}>{budget}</option>}
                        <option value="€ 0 – € 500">€ 0 – € 500</option>
                        <option value="€ 500 – € 1.000">€ 500 – € 1.000</option>
                        <option value="€ 1.000 – € 1.500">€ 1.000 – € 1.500</option>
                        <option value="€ 1.500 – € 2.000">€ 1.500 – € 2.000</option>
                        <option value="€ 2.000+">€ 2.000+</option>
                      </select>
                      <small className="field-hint">
                        {travelWishes[selectedCustomer ? profileKey(selectedCustomer) : '']
                          ? 'Overgenomen uit de reiswens'
                          : 'Optioneel als het budget nog onbekend is'}
                      </small>
                    </label>
                  </div>
                </>
              )}

              {!generatedOffer && step === 2 && (
                <>
                  {!selectedProposal ? (
                    <div className="proposal-empty">
                      <span>
                        <Icon name="map" size={27} />
                      </span>
                      <h3>Nog geen reis gekozen</h3>
                      <p>
                        Kies een andere bestemming of reis. De klant- en conceptgegevens blijven
                        bewaard.
                      </p>
                      <div className="alternative-picker-toolbar">
                        <label>
                          Bestemming
                          <select
                            value={proposalDestination}
                            onChange={(event) => setProposalDestination(event.target.value)}
                          >
                            <option value="">Alle bestemmingen</option>
                            {[
                              ...new Set(
                                travelProposals
                                  .filter((proposal) => proposal.available)
                                  .map((proposal) => proposal.country),
                              ),
                            ]
                              .sort((a, b) => a.localeCompare(b, 'nl'))
                              .map((country) => (
                                <option value={country} key={country}>
                                  {country}
                                </option>
                              ))}
                          </select>
                        </label>
                        <span>
                          {
                            travelProposals.filter(
                              (proposal) =>
                                !travelCapacityError(proposal, travellers) &&
                                (!proposalDestination || proposal.country === proposalDestination),
                            ).length
                          }{' '}
                          beschikbare opties voor {travellers || '—'}{' '}
                          {travellerCount === 1 ? 'reiziger' : 'reizigers'}
                        </span>
                      </div>
                      <div className="proposal-list">
                        {travelProposals
                          .filter(
                            (proposal) =>
                              !travelCapacityError(proposal, travellers) &&
                              (!proposalDestination || proposal.country === proposalDestination),
                          )
                          .map((proposal) => {
                            const startPrice = getTravelPricePerPerson(
                              proposal,
                              travellerCount || 1,
                            )
                            return (
                              <button key={proposal.id} onClick={() => selectProposal(proposal.id)}>
                                <div>
                                  <b>{proposal.title}</b>
                                  <small>
                                    {proposal.destination} · {proposal.dates} · {proposal.duration}{' '}
                                    dagen
                                  </small>
                                </div>
                                <strong>vanaf {formatPrice(startPrice)} p.p.</strong>
                                <Icon name="chevron" size={16} />
                              </button>
                            )
                          })}
                        {travelProposals.filter(
                          (proposal) =>
                            !travelCapacityError(proposal, travellers) &&
                            (!proposalDestination || proposal.country === proposalDestination),
                        ).length === 0 && (
                          <p className="proposal-no-results">
                            Geen beschikbare reizen voor deze bestemming en groepsgrootte.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="selected-trip-head">
                        <div>
                          {availability === 'valid' && <Badge tone="success">Beschikbaar</Badge>}
                          <h3>{selectedProposal.title}</h3>
                          <p>
                            {selectedProposal.destination} · {selectedProposal.dates} · {travellers}{' '}
                            {travellerCount === 1 ? 'reiziger' : 'reizigers'}
                          </p>
                        </div>
                        <button
                          className="inline-action"
                          onClick={() => {
                            setProposalDestination('')
                            selectProposal('')
                          }}
                        >
                          Andere reis of bestemming kiezen
                        </button>
                      </div>
                      <div className="travel-parts interactive">
                        <h3>Reisonderdelen</h3>
                        {selectedProposal.parts.map((part) => {
                          const choice = getPartChoice(part)
                          const priceDifference =
                            (choice.price - part.price) * (part.perPerson ? travellerCount : 1)
                          const invalid =
                            availability === 'error' && selectedParts[part.id] && !choice.available
                          return (
                            <div
                              className={`${part.required ? 'required' : 'selectable'} ${selectedParts[part.id] ? 'selected' : ''} ${invalid ? 'part-error' : ''}`}
                              key={part.id}
                              onClick={() => togglePart(part.id)}
                            >
                              {part.required ? (
                                <span className="fixed-check">
                                  <Icon name="check" size={14} />
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="checkbox"
                                    aria-label={part.label}
                                    checked={Boolean(selectedParts[part.id])}
                                    onChange={() => togglePart(part.id)}
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                  <span className="part-check">
                                    <Icon name="check" size={14} />
                                  </span>
                                </>
                              )}
                              <span className="part-info">
                                <b>{choice.label}</b>
                                <small>
                                  {part.required
                                    ? 'Vast onderdeel'
                                    : selectedParts[part.id]
                                      ? 'Geselecteerd'
                                      : 'Niet geselecteerd'}{' '}
                                  ·{' '}
                                  {part.perPerson
                                    ? `${formatPrice(choice.price)} p.p.`
                                    : formatPrice(choice.price)}
                                </small>
                                {priceDifference !== 0 && (
                                  <small
                                    className={`price-difference ${priceDifference < 0 ? 'lower' : 'higher'}`}
                                  >
                                    {priceDifference > 0 ? '+ ' : '− '}
                                    {formatPrice(Math.abs(priceDifference))} t.o.v. origineel
                                  </small>
                                )}
                                {invalid && (
                                  <em>Dit onderdeel is niet beschikbaar. Kies een alternatief.</em>
                                )}
                              </span>
                              {part.alternatives?.length ? (
                                <button
                                  className="inline-action"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    changePartAlternative(part.id)
                                  }}
                                >
                                  Wijzigen
                                </button>
                              ) : (
                                <strong>
                                  {selectedParts[part.id]
                                    ? formatPrice(
                                        choice.price * (part.perPerson ? travellerCount : 1),
                                      )
                                    : '—'}
                                </strong>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="extras">
                        <div className="form-section-title">
                          <div>
                            <h3>Opties en extra’s</h3>
                            <p>De totaalprijs wordt direct opnieuw berekend.</p>
                          </div>
                        </div>
                        {offerExtras.map((extra) => (
                          <label className={!extra.available ? 'unavailable' : ''} key={extra.id}>
                            <input
                              type="checkbox"
                              checked={Boolean(selectedExtras[extra.id])}
                              disabled={!extra.available}
                              onChange={() => toggleExtra(extra.id)}
                            />
                            <span className="option-check">
                              <Icon name="check" size={13} />
                            </span>
                            <span>
                              <b>{extra.label}</b>
                              <small>
                                {extra.available
                                  ? extra.perPerson
                                    ? 'Prijs per reiziger'
                                    : 'Vaste prijs'
                                  : 'Niet beschikbaar: leverancier biedt dit niet aan op deze reisdata'}
                              </small>
                            </span>
                            <strong>
                              + {formatPrice(extra.price)}
                              {extra.perPerson ? ' p.p.' : ''}
                            </strong>
                          </label>
                        ))}
                      </div>
                      <div className="live-total">
                        <div>
                          <small>Gekozen reisonderdelen</small>
                          <b>{formatPrice(partsTotal)}</b>
                        </div>
                        <div>
                          <small>Gekozen extra’s</small>
                          <b>{formatPrice(extrasTotal)}</b>
                        </div>
                        <div>
                          <small>Servicekosten ({travellers} × € 39)</small>
                          <b>{formatPrice(serviceCosts)}</b>
                        </div>
                        {priceAdjustment > 0 && (
                          <div>
                            <small>Bevestigde prijswijziging</small>
                            <b>+ {formatPrice(priceAdjustment)}</b>
                          </div>
                        )}
                        <div>
                          <span>Totale reissom</span>
                          <strong>{formatPrice(totalPrice)}</strong>
                        </div>
                      </div>
                      <div className="tax-breakdown">
                        <div className="form-section-title">
                          <div>
                            <h3>BTW, belastingen en verplichte kosten</h3>
                            <p>Tarieven zonder bevestigd bedrag blijven configureerbaar.</p>
                          </div>
                          <Badge tone={customerType === 'business' ? 'info' : 'neutral'}>
                            {customerType === 'business' ? 'Zakelijk' : 'Particulier'}
                          </Badge>
                        </div>
                        {customerType === 'business' ? (
                          <>
                            <div>
                              <span>Reissom excl. BTW</span>
                              <b>{formatPrice(totalExcludingVat)}</b>
                            </div>
                            <div className="tax-rate-row">
                              <label>
                                BTW-percentage
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  step="0.1"
                                  value={vatRate}
                                  aria-invalid={Boolean(vatError)}
                                  aria-describedby="quote-vat-error"
                                  onChange={(event) => {
                                    setVatRate(event.target.value)
                                    setAvailability('idle')
                                  }}
                                />
                                <FieldError id="quote-vat-error" message={vatError} />
                              </label>
                              <span>BTW ({vatRate || '0'}%)</span>
                              <b>{formatPrice(vatAmount)}</b>
                            </div>
                          </>
                        ) : (
                          <div>
                            <span>Waarvan BTW ({vatRate || '0'}%) · inbegrepen</span>
                            <b>{formatPrice(vatAmount)}</b>
                          </div>
                        )}
                        {destinationFees.map((fee) => (
                          <div className="destination-fee" key={fee.id}>
                            <span>
                              <b>{fee.label}</b>
                              <small>{fee.description}</small>
                            </span>
                            {fee.payment === 'included' ? (
                              <strong>Inbegrepen in reissom</strong>
                            ) : (
                              <label>
                                Configureerbaar tarief (
                                {fee.unit === 'perPersonNight' ? 'p.p.p.n.' : 'p.p.'})
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={localFeeRates[fee.id] ?? ''}
                                  aria-invalid={Boolean(feeErrors[fee.id])}
                                  aria-describedby={`${fee.id}-error`}
                                  onChange={(event) => {
                                    setLocalFeeRates((current) => ({
                                      ...current,
                                      [fee.id]: event.target.value,
                                    }))
                                    setAvailability('idle')
                                  }}
                                  placeholder="Nog te bevestigen"
                                />
                                <FieldError
                                  id={`${fee.id}-error`}
                                  message={feeErrors[fee.id] ?? ''}
                                />
                              </label>
                            )}
                          </div>
                        ))}
                        {localDestinationFee && (
                          <div className="local-fee-total">
                            <span>Indicatie ter plaatse te betalen</span>
                            <b>
                              {localFeeEstimate === null
                                ? 'Ongeldig tarief'
                                : localFeeKnown
                                  ? formatPrice(localFeeEstimate)
                                  : 'Tarief nog te bevestigen'}
                            </b>
                          </div>
                        )}
                        <div className="tax-total">
                          <span>Totale reissom aan Voyage Vista</span>
                          <strong>{formatPrice(totalPrice)}</strong>
                        </div>
                      </div>
                      {budgetExceededBy > 0 && (
                        <div className="budget-warning">
                          <Icon name="clock" size={17} />
                          <div>
                            <b>{formatPrice(budgetExceededBy)} boven het klantbudget</b>
                            <small>Pas onderdelen aan of kies een goedkoper alternatief.</small>
                          </div>
                        </div>
                      )}
                      <div className={`availability availability-${availability}`}>
                        <span>
                          <Icon name={availability === 'valid' ? 'check' : 'clock'} size={17} />
                        </span>
                        <div>
                          <b>
                            {availability === 'valid'
                              ? 'Geladen reisgegevens gecontroleerd'
                              : availability === 'checking'
                                ? 'Bezig met controleren…'
                                : availability === 'error'
                                  ? selectedProposal.remainingSpots !== undefined &&
                                    selectedProposal.remainingSpots < travellerCount
                                    ? 'Onvoldoende plaatsen beschikbaar'
                                    : 'Een onderdeel is niet beschikbaar'
                                  : availability === 'price-change'
                                    ? 'De prijs is gewijzigd'
                                    : 'Controle vereist'}
                          </b>
                          <small>
                            {availability === 'valid'
                              ? 'De prijzen zijn actueel en alle onderdelen zijn beschikbaar.'
                              : availability === 'error'
                                ? selectedProposal.remainingSpots !== undefined &&
                                  selectedProposal.remainingSpots < travellerCount
                                  ? `Er zijn nog ${selectedProposal.remainingSpots} plaatsen beschikbaar voor ${travellers} reizigers. Kies een andere reis of verlaag het aantal reizigers.`
                                  : 'Kies bij het gemarkeerde onderdeel een beschikbaar alternatief en controleer opnieuw.'
                                : availability === 'price-change'
                                  ? `De leverancier rekent ${formatPrice(pendingPriceChange)} extra. Bevestig dit voordat je doorgaat.`
                                  : 'Controleer de prijs en beschikbaarheid op basis van de geladen reisgegevens.'}
                          </small>
                        </div>
                        {availability === 'price-change' ? (
                          <Button onClick={confirmPriceChange}>Prijs bevestigen</Button>
                        ) : (
                          <Button
                            variant="secondary"
                            disabled={
                              availability === 'checking' ||
                              Boolean(countError || capacityError) ||
                              !taxesValid
                            }
                            onClick={checkAvailability}
                          >
                            {availability === 'checking' ? 'Controleren…' : 'Nu controleren'}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {!generatedOffer && step === 3 && selectedCustomer && selectedProposal && (
                <>
                  <div className="review-block">
                    <div className="review-title">
                      <div>
                        <p className="eyebrow">KLANT</p>
                        <h3>{selectedCustomer.name}</h3>
                      </div>
                      <button className="inline-action" onClick={() => setStep(1)}>
                        Aanpassen
                      </button>
                    </div>
                    <p>
                      {selectedCustomer.email} · {selectedCustomer.phone}
                    </p>
                    <p>
                      {travellers} {travellerCount === 1 ? 'reiziger' : 'reizigers'}
                      {budget ? ` · Budget ${budget}` : ''}
                    </p>
                  </div>
                  <div className="review-block">
                    <div className="review-title">
                      <div>
                        <p className="eyebrow">REIS</p>
                        <h3>{selectedProposal.title}</h3>
                      </div>
                      <button className="inline-action" onClick={() => setStep(2)}>
                        Aanpassen
                      </button>
                    </div>
                    <p>
                      {selectedProposal.destination} · {selectedProposal.dates}
                    </p>
                    <ul>
                      {selectedProposal.parts
                        .filter((part) => selectedParts[part.id])
                        .map((part) => (
                          <li key={part.id}>{getPartChoice(part).label}</li>
                        ))}
                      {offerExtras
                        .filter((extra) => selectedExtras[extra.id])
                        .map((extra) => (
                          <li key={extra.id}>{extra.label}</li>
                        ))}
                    </ul>
                  </div>
                  {budgetExceededBy > 0 && (
                    <div className="budget-warning">
                      <Icon name="clock" size={17} />
                      <div>
                        <b>Offerte is {formatPrice(budgetExceededBy)} hoger dan het budget</b>
                        <small>Controleer dit met de klant voordat je de offerte verstuurt.</small>
                      </div>
                    </div>
                  )}
                  <div className="price-breakdown">
                    <h3>Prijsopbouw</h3>
                    {selectedProposal.parts
                      .filter((part) => selectedParts[part.id])
                      .map((part) => {
                        const choice = getPartChoice(part)
                        return (
                          <div key={part.id}>
                            <span>
                              {choice.label}
                              {part.perPerson ? ` (${travellers}×)` : ''}
                            </span>
                            <b>
                              {formatPrice(choice.price * (part.perPerson ? travellerCount : 1))}
                            </b>
                          </div>
                        )
                      })}
                    {offerExtras
                      .filter((extra) => selectedExtras[extra.id])
                      .map((extra) => (
                        <div key={extra.id}>
                          <span>
                            {extra.label}
                            {extra.perPerson ? ` (${travellers}×)` : ''}
                          </span>
                          <b>{formatPrice(extra.price * (extra.perPerson ? travellerCount : 1))}</b>
                        </div>
                      ))}
                    <div>
                      <span>Servicekosten ({travellers} × € 39)</span>
                      <b>{formatPrice(serviceCosts)}</b>
                    </div>
                    {priceAdjustment > 0 && (
                      <div>
                        <span>Bevestigde prijswijziging</span>
                        <b>{formatPrice(priceAdjustment)}</b>
                      </div>
                    )}
                    {customerType === 'business' ? (
                      <>
                        <div>
                          <span>Subtotaal excl. BTW</span>
                          <b>{formatPrice(totalExcludingVat)}</b>
                        </div>
                        <div>
                          <span>BTW ({vatRate || '0'}%)</span>
                          <b>{formatPrice(vatAmount)}</b>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span>BTW ({vatRate || '0'}%) inbegrepen</span>
                        <b>{formatPrice(vatAmount)}</b>
                      </div>
                    )}
                    <div className="total">
                      <span>Totale reissom</span>
                      <strong>{formatPrice(totalPrice)}</strong>
                    </div>
                  </div>
                  <div className="review-block tax-review">
                    <div className="review-title">
                      <div>
                        <p className="eyebrow">AANVULLENDE HEFFINGEN</p>
                        <h3>{localDestinationFee?.label ?? 'Lokale heffingen'}</h3>
                      </div>
                      <Badge tone={localFeeKnown ? 'warning' : 'neutral'}>Ter plaatse</Badge>
                    </div>
                    <p>{localDestinationFee?.description}</p>
                    <p>
                      {localFeeKnown
                        ? `${formatPrice(localFeeEstimate)} indicatief voor het reisgezelschap`
                        : 'Tarief is nog niet bevestigd en niet opgenomen in de totale reissom.'}
                    </p>
                  </div>
                  <div className="offer-checklist">
                    <div className="form-section-title">
                      <div>
                        <h3>Controle vóór genereren</h3>
                        <p>Alle verplichte gegevens moeten gereed zijn.</p>
                      </div>
                      <Badge tone={canGenerateOffer ? 'success' : 'warning'}>
                        {offerChecks.filter((check) => check.valid).length}/{offerChecks.length}{' '}
                        gereed
                      </Badge>
                    </div>
                    {offerChecks.map((check) => (
                      <div className={check.valid ? 'complete' : 'incomplete'} key={check.label}>
                        <span>
                          <Icon name={check.valid ? 'check' : 'clock'} size={14} />
                        </span>
                        <b>{check.label}</b>
                      </div>
                    ))}
                  </div>
                  <label>
                    Persoonlijk bericht
                    <textarea
                      value={effectiveMessage}
                      onChange={(event) => setPersonalMessage(event.target.value)}
                    />
                  </label>
                </>
              )}

              {generatedOffer && selectedCustomer && selectedProposal && (
                <div className="offer-preview">
                  <div className="preview-status">
                    <Badge tone={generatedOffer.status === 'Verstuurd' ? 'info' : 'neutral'}>
                      {generatedOffer.status}
                    </Badge>
                    <span>{generatedOffer.number}</span>
                  </div>
                  <div className="preview-brand">
                    <span>
                      <Icon name="plane" size={23} />
                    </span>
                    <div>
                      VOYAGE<b>VISTA</b>
                    </div>
                  </div>
                  <h2>Jouw reisvoorstel</h2>
                  <p className="preview-intro">
                    Voor {selectedCustomer.name} · {selectedProposal.dates}
                  </p>
                  <p className="preview-message">{effectiveMessage}</p>
                  <div className="preview-route">
                    <span>{selectedProposal.destination}</span>
                    <strong>{formatPrice(totalPrice)}</strong>
                    <small>
                      voor {travellers} {travellerCount === 1 ? 'reiziger' : 'reizigers'}
                    </small>
                  </div>
                  <div className="preview-details">
                    <div>
                      <small>Reis</small>
                      <b>{selectedProposal.title}</b>
                    </div>
                    <div>
                      <small>Inbegrepen</small>
                      <b>
                        {Object.values(selectedParts).filter(Boolean).length +
                          Object.values(selectedExtras).filter(Boolean).length}{' '}
                        onderdelen
                      </b>
                    </div>
                    <div>
                      <small>Contact</small>
                      <b>{selectedCustomer.email}</b>
                    </div>
                  </div>
                  <div className="preview-lines">
                    {selectedProposal.parts
                      .filter((part) => selectedParts[part.id])
                      .map((part) => (
                        <span key={part.id}>
                          <Icon name="check" size={13} />
                          {getPartChoice(part).label}
                        </span>
                      ))}
                    {offerExtras
                      .filter((extra) => selectedExtras[extra.id])
                      .map((extra) => (
                        <span key={extra.id}>
                          <Icon name="check" size={13} />
                          {extra.label}
                        </span>
                      ))}
                  </div>
                  <div className="preview-prices">
                    {selectedProposal.parts
                      .filter((part) => selectedParts[part.id])
                      .map((part) => {
                        const choice = getPartChoice(part)
                        return (
                          <div key={part.id}>
                            <span>{choice.label}</span>
                            <b>
                              {formatPrice(choice.price * (part.perPerson ? travellerCount : 1))}
                            </b>
                          </div>
                        )
                      })}
                    {offerExtras
                      .filter((extra) => selectedExtras[extra.id])
                      .map((extra) => (
                        <div key={extra.id}>
                          <span>{extra.label}</span>
                          <b>{formatPrice(extra.price * (extra.perPerson ? travellerCount : 1))}</b>
                        </div>
                      ))}
                    <div>
                      <span>Servicekosten</span>
                      <b>{formatPrice(serviceCosts)}</b>
                    </div>
                    {priceAdjustment > 0 && (
                      <div>
                        <span>Prijswijziging</span>
                        <b>{formatPrice(priceAdjustment)}</b>
                      </div>
                    )}
                    {customerType === 'business' ? (
                      <>
                        <div>
                          <span>Subtotaal excl. BTW</span>
                          <b>{formatPrice(totalExcludingVat)}</b>
                        </div>
                        <div>
                          <span>BTW ({vatRate || '0'}%)</span>
                          <b>{formatPrice(vatAmount)}</b>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span>BTW inbegrepen</span>
                        <b>{formatPrice(vatAmount)}</b>
                      </div>
                    )}
                    <div className="total">
                      <span>Totale reissom</span>
                      <strong>{formatPrice(totalPrice)}</strong>
                    </div>
                  </div>
                  {generatedOffer.status === 'Verstuurd' && (
                    <div className="send-success" role="status">
                      <Icon name="check" size={17} /> Offerte gedeeld in de klantomgeving van{' '}
                      {selectedCustomer.email}
                    </div>
                  )}
                  <ErrorNotice message={sendError || mutation.error} />
                </div>
              )}
            </div>
            {!generatedOffer ? (
              <div className="modal-actions">
                {step > 1 ? (
                  <Button variant="secondary" onClick={() => setStep(step - 1)}>
                    Vorige
                  </Button>
                ) : (
                  <span />
                )}
                {step === 3 ? (
                  <Button disabled={!canGenerateOffer || mutation.pending} onClick={createOffer}>
                    Offerte genereren <Icon name="file" size={16} />
                  </Button>
                ) : (
                  <Button
                    disabled={
                      step === 1
                        ? !selectedCustomer ||
                          !isValidEmail(selectedCustomer.email) ||
                          Boolean(countError || capacityError) ||
                          !taxesValid
                        : !canGenerateOffer
                    }
                    onClick={() => {
                      if (!countError && !capacityError && taxesValid) setStep(step + 1)
                    }}
                  >
                    Volgende stap <Icon name="arrow" size={16} />
                  </Button>
                )}
              </div>
            ) : (
              <div className="modal-actions preview-actions">
                {generatedOffer.status === 'Concept' && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setGeneratedOffer(null)
                      setStep(3)
                    }}
                  >
                    Concept aanpassen
                  </Button>
                )}
                <Button variant="secondary" onClick={downloadOffer}>
                  Downloaden
                </Button>
                <Button variant="secondary" onClick={() => setCreating(false)}>
                  Sluiten
                </Button>
                <Button
                  disabled={
                    sending ||
                    generatedOffer.status === 'Verstuurd' ||
                    generatedOffer.status === 'Geaccepteerd'
                  }
                  onClick={sendOffer}
                >
                  {sending
                    ? 'Delen…'
                    : generatedOffer.status === 'Verstuurd'
                      ? 'Gedeeld met klant'
                      : 'Delen met klant'}{' '}
                  <Icon name="arrow" size={16} />
                </Button>
              </div>
            )}
          </Dialog>
        </div>
      )}
    </>
  )
}

type SearchCriteria = {
  destination: string
  departure: string
  returnDate: string
  travellers: number
}
type TripsSessionState = {
  draft: SearchCriteria
  selectedCustomerEmail: string
  showOverBudget: boolean
  maxPrice: string
  viewMode: 'current' | 'archive'
  minRating: string
  sort: string
  compareIds: string[]
  requestBudget?: string
}

const defaultSearch: SearchCriteria = {
  destination: '',
  departure: '',
  returnDate: '',
  travellers: 2,
}
let tripsSessionState: TripsSessionState | null = null
const formatTravelPrice = (amount: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
const getBudgetLimit = (budget: string) => {
  const values = budget.match(/\d[\d.]*(?:,\d{1,2})?/g) ?? []
  return budget.includes('+') || values.length === 0
    ? null
    : Number(values[values.length - 1].replace(/\./g, '').replace(',', '.'))
}
const getTravelTotal = (travel: Travel, count: number) =>
  calculateTravelPrice(travel, count).totalPrice
const getTravelPricePerPerson = (travel: Travel, count: number) =>
  travellerError(count) ? 0 : getTravelTotal(travel, count) / count

function Trips({ selectForQuote }: { selectForQuote: (selection: TravelSelection) => void }) {
  const { customers, travelWishes, travelProposals, offerExtras, destinationFeeLabels } =
    useVoyageData()
  const [customerOptions] = useBackendState(customers)
  const [requestBudget, setRequestBudget] = useState(tripsSessionState?.requestBudget)
  const [draft, setDraft] = useState<SearchCriteria>(
    () => tripsSessionState?.draft ?? defaultSearch,
  )
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(
    () => tripsSessionState?.selectedCustomerEmail ?? '',
  )
  const [showOverBudget, setShowOverBudget] = useState(
    () => tripsSessionState?.showOverBudget ?? false,
  )
  const [maxPrice, setMaxPrice] = useState(() => tripsSessionState?.maxPrice ?? '')
  const [viewMode, setViewMode] = useState<'current' | 'archive'>(
    () => tripsSessionState?.viewMode ?? 'current',
  )
  const [minRating, setMinRating] = useState(() => tripsSessionState?.minRating ?? '')
  const [sort, setSort] = useState(() => tripsSessionState?.sort ?? 'recommended')
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>(() => tripsSessionState?.compareIds ?? [])
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    tripsSessionState = {
      draft,
      selectedCustomerEmail,
      showOverBudget,
      maxPrice,
      viewMode,
      minRating,
      sort,
      compareIds,
      requestBudget,
    }
  }, [
    draft,
    selectedCustomerEmail,
    showOverBudget,
    maxPrice,
    viewMode,
    minRating,
    sort,
    compareIds,
    requestBudget,
  ])

  const selectedSearchCustomer = findCustomer(customerOptions, selectedCustomerEmail) ?? null
  const selectedSearchWish = requestBudget
    ? { budget: requestBudget }
    : travelWishes[selectedCustomerEmail]
  const selectedSearchCustomerType = getCustomerType(selectedCustomerEmail, customers)
  const searchBudgetLimit = getBudgetLimit(selectedSearchWish?.budget ?? '')
  const potentialExtrasTotal = offerExtras
    .filter((extra) => extra.available)
    .reduce((sum, extra) => sum + extra.price * (extra.perPerson ? draft.travellers : 1), 0)

  const searchError =
    dateOrderError(draft.departure, draft.returnDate) || travellerError(draft.travellers)
  const results = useMemo(() => {
    if (searchError) return []
    const destination = draft.destination.trim().toLowerCase()
    const requestedDuration =
      draft.departure && draft.returnDate
        ? Math.round(
            (new Date(draft.returnDate).getTime() - new Date(draft.departure).getTime()) / 86400000,
          )
        : 0
    const filtered = travelProposals.filter((travel) => {
      const matchesDestination =
        !destination ||
        `${travel.destination} ${travel.country} ${travel.title}`
          .toLowerCase()
          .includes(destination)
      const matchesDuration =
        !requestedDuration || Math.abs(travel.duration - requestedDuration) <= 2
      const matchesDates =
        (!draft.departure || travel.startDate === draft.departure) &&
        (!draft.returnDate || travel.endDate === draft.returnDate)
      const matchesTravellers = !travelCapacityError(
        { ...travel, available: true },
        draft.travellers,
      )
      const matchesPrice =
        !maxPrice || getTravelPricePerPerson(travel, draft.travellers) <= Number(maxPrice)
      const totalTravelPrice = getTravelTotal(travel, draft.travellers)
      const matchesCustomerBudget =
        searchBudgetLimit === null || showOverBudget || totalTravelPrice <= searchBudgetLimit
      const matchesAvailability = viewMode === 'current' ? travel.available : !travel.available
      const matchesRating = !minRating || travel.rating >= Number(minRating)
      return (
        matchesDestination &&
        matchesDuration &&
        matchesDates &&
        matchesTravellers &&
        matchesPrice &&
        matchesCustomerBudget &&
        matchesAvailability &&
        matchesRating
      )
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'price-asc')
        return (
          getTravelPricePerPerson(a, draft.travellers) -
          getTravelPricePerPerson(b, draft.travellers)
        )
      if (sort === 'price-desc')
        return (
          getTravelPricePerPerson(b, draft.travellers) -
          getTravelPricePerPerson(a, draft.travellers)
        )
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'duration') return a.duration - b.duration
      return Number(b.available) - Number(a.available) || b.rating - a.rating
    })
  }, [draft, maxPrice, searchBudgetLimit, showOverBudget, viewMode, minRating, sort, searchError])

  const alternatives = useMemo(() => {
    if (!selectedTravel) return []
    // Use the actual filtered results: no fallback may silently violate dates,
    // destination, capacity, rating or the selected customer's budget.
    return travelProposals
      .filter(
        (travel) =>
          travel.id !== selectedTravel.id &&
          !travelCapacityError(travel, draft.travellers) &&
          (!draft.destination ||
            `${travel.destination} ${travel.country} ${travel.title}`
              .toLowerCase()
              .includes(draft.destination.toLowerCase())) &&
          (!draft.departure || travel.startDate === draft.departure) &&
          (!draft.returnDate || travel.endDate === draft.returnDate) &&
          (!maxPrice || getTravelPricePerPerson(travel, draft.travellers) <= Number(maxPrice)) &&
          (!minRating || travel.rating >= Number(minRating)) &&
          (searchBudgetLimit === null ||
            showOverBudget ||
            getTravelTotal(travel, draft.travellers) <= searchBudgetLimit),
      )
      .slice(0, 3)
  }, [selectedTravel, draft, maxPrice, minRating, searchBudgetLimit, showOverBudget])
  const selectedTravelNearlyFull =
    selectedTravel?.remainingSpots !== undefined && selectedTravel.remainingSpots <= 4

  const resetFilters = () => {
    setDraft({ ...defaultSearch })
    setSelectedCustomerEmail('')
    setRequestBudget(undefined)
    setShowOverBudget(false)
    setMaxPrice('')
    setViewMode('current')
    setMinRating('')
    setSort('recommended')
  }
  const toggleCompare = (id: string) => {
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    )
  }
  const comparedTravels = compareIds
    .map((id) => travelProposals.find((travel) => travel.id === id))
    .filter((travel): travel is Travel => Boolean(travel))

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">REISAANBOD</p>
          <h1>Reis zoeken</h1>
          <p>Vergelijk beschikbaarheid, prijzen en onderdelen.</p>
        </div>
      </section>
      <section className="search-hero">
        <h2>Waar wil de klant naartoe?</h2>
        <div className="trip-search">
          <label>
            Klant
            <select
              value={selectedCustomerEmail}
              onChange={(event) => {
                const email = event.target.value
                const wish = travelWishes[email]
                setSelectedCustomerEmail(email)
                setRequestBudget(undefined)
                setShowOverBudget(false)
                if (wish) setDraft((current) => ({ ...current, travellers: wish.travellers }))
              }}
            >
              <option value="">Geen klant geselecteerd</option>
              {customerOptions.map((customer) => (
                <option value={profileKey(customer)} key={profileKey(customer)}>
                  {customer.name} · {customer.email}
                  {customer.accountProfile ? ' · App-account' : ''} · {customer.id?.slice(-6)} ·{' '}
                  {getCustomerType(profileKey(customer), customers) === 'business'
                    ? 'Zakelijk'
                    : 'Particulier'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bestemming
            <select
              value={draft.destination}
              onChange={(event) => setDraft({ ...draft, destination: event.target.value })}
            >
              <option value="">Alle bestemmingen</option>
              {draft.destination &&
                !travelProposals.some((travel) => travel.country === draft.destination) && (
                  <option value={draft.destination}>{draft.destination}</option>
                )}
              {[...new Set(travelProposals.map((travel) => travel.country))]
                .sort((a, b) => a.localeCompare(b, 'nl'))
                .map((country) => (
                  <option value={country} key={country}>
                    {country}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Vertrek
            <input
              type="date"
              value={draft.departure}
              onChange={(event) => setDraft({ ...draft, departure: event.target.value })}
            />
          </label>
          <label>
            Terug
            <input
              type="date"
              min={draft.departure}
              aria-invalid={Boolean(dateOrderError(draft.departure, draft.returnDate))}
              value={draft.returnDate}
              onChange={(event) => setDraft({ ...draft, returnDate: event.target.value })}
            />
          </label>
          <label>
            Reizigers
            <select
              value={draft.travellers}
              onChange={(event) => setDraft({ ...draft, travellers: Number(event.target.value) })}
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                <option value={count} key={count}>
                  {count} {count === 1 ? 'persoon' : 'personen'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="trip-controls">
        <select
          aria-label="Maximumprijs"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        >
          <option value="">Alle prijzen</option>
          <option value="500">Tot € 500 p.p.</option>
          <option value="750">Tot € 750 p.p.</option>
          <option value="1000">Tot € 1.000 p.p.</option>
        </select>
        <Button
          variant="secondary"
          onClick={() => setViewMode(viewMode === 'current' ? 'archive' : 'current')}
        >
          {viewMode === 'current'
            ? `Oud aanbod (${travelProposals.filter((travel) => !travel.available).length})`
            : 'Terug naar actueel aanbod'}
        </Button>
        {selectedSearchCustomer && searchBudgetLimit !== null && (
          <Button variant="secondary" onClick={() => setShowOverBudget(!showOverBudget)}>
            {showOverBudget ? 'Verberg boven budget' : 'Toon boven budget'}
          </Button>
        )}
        <select
          aria-label="Minimale beoordeling"
          value={minRating}
          onChange={(event) => setMinRating(event.target.value)}
        >
          <option value="">Alle beoordelingen</option>
          <option value="4.5">4,5 of hoger</option>
          <option value="4.8">4,8 of hoger</option>
        </select>
        <button className="text-button" onClick={resetFilters}>
          Filters resetten
        </button>
      </section>
      <section className="results-head">
        <div>
          <h2>
            {results.length}{' '}
            {viewMode === 'archive'
              ? results.length === 1
                ? 'oude reis'
                : 'oude reizen'
              : results.length === 1
                ? 'reis'
                : 'reizen'}{' '}
            gevonden
          </h2>
          <p>
            {viewMode === 'archive'
              ? 'Oud en niet-beschikbaar aanbod voor medewerkers'
              : selectedSearchCustomer
                ? `Passend aanbod voor ${selectedSearchCustomer.name} · budget ${selectedSearchWish?.budget ?? 'niet ingesteld'}`
                : 'Actueel beschikbaar aanbod voor de gekozen reiscriteria'}
          </p>
        </div>
        <div className="results-actions">
          {compareIds.length > 0 && (
            <Button variant="secondary" onClick={() => setShowComparison(true)}>
              Vergelijk ({compareIds.length})
            </Button>
          )}
          <select
            aria-label="Reizen sorteren"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="recommended">Sorteer: aanbevolen</option>
            <option value="price-asc">Prijs laag–hoog</option>
            <option value="price-desc">Prijs hoog–laag</option>
            <option value="rating">Beoordeling</option>
            <option value="duration">Reisduur</option>
          </select>
        </div>
      </section>
      <section className="trip-list">
        {searchError && <ErrorNotice message={searchError} />}
        {!searchError && results.length === 0 && (
          <div className="trip-empty">
            <Icon name="search" size={28} />
            <h3>Geen reizen gevonden</h3>
            <p>Pas de bestemming, reisperiode of filters aan en probeer opnieuw.</p>
            <Button variant="secondary" onClick={resetFilters}>
              Filters resetten
            </Button>
          </div>
        )}
        {results.map((travel, index) => (
          <article className="trip-result" key={travel.id}>
            <div className="destination-art destination-photo">
              <TravelPhoto
                travel={travel}
                alt={`Sfeerfoto bij ${travel.destination}`}
                eager={index === 0}
              />
              <span>{travel.country}</span>
            </div>
            <div className="trip-copy">
              <Badge tone={travel.available ? 'success' : 'warning'}>
                {travel.availabilityLabel}
              </Badge>
              <h3>{travel.title}</h3>
              <p>
                {travel.description} · {travel.duration} dagen ·{' '}
                {travel.rating.toLocaleString('nl-NL')} / 5
              </p>
              <div>
                {travel.facilities.slice(0, 2).map((facility) => (
                  <span key={facility}>{facility}</span>
                ))}
              </div>
              {searchBudgetLimit !== null && (
                <div
                  className={`travel-budget-note ${getTravelTotal(travel, draft.travellers) > searchBudgetLimit ? 'over' : getTravelTotal(travel, draft.travellers) + potentialExtrasTotal > searchBudgetLimit ? 'warning' : 'within'}`}
                >
                  <span>
                    <Icon
                      name={
                        getTravelTotal(travel, draft.travellers) + potentialExtrasTotal >
                        searchBudgetLimit
                          ? 'clock'
                          : 'check'
                      }
                      size={13}
                    />
                    {getTravelTotal(travel, draft.travellers) > searchBudgetLimit
                      ? `${formatTravelPrice(getTravelTotal(travel, draft.travellers) - searchBudgetLimit)} boven budget`
                      : getTravelTotal(travel, draft.travellers) + potentialExtrasTotal >
                          searchBudgetLimit
                        ? 'Binnen budget · extra’s kunnen budget overschrijden'
                        : `Binnen budget · ${formatTravelPrice(searchBudgetLimit - getTravelTotal(travel, draft.travellers))} ruimte`}
                  </span>
                </div>
              )}
            </div>
            <div className="trip-price">
              <label className="compare-toggle">
                <input
                  type="checkbox"
                  checked={compareIds.includes(travel.id)}
                  onChange={() => toggleCompare(travel.id)}
                  disabled={!compareIds.includes(travel.id) && compareIds.length >= 3}
                />{' '}
                Vergelijken
              </label>
              <small>
                {selectedSearchCustomerType === 'business'
                  ? 'vanaf · BTW apart gespecificeerd'
                  : 'vanaf · incl. BTW'}
              </small>
              <strong>
                {formatTravelPrice(getTravelPricePerPerson(travel, draft.travellers))} p.p.
              </strong>
              <small>
                {formatTravelPrice(getTravelTotal(travel, draft.travellers))} totaal voor{' '}
                {draft.travellers}
              </small>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedTravel(travel)
                }}
              >
                Bekijk reis
              </Button>
            </div>
          </article>
        ))}
      </section>
      {selectedTravel && (
        <Dialog
          className="overlay"
          titleId="dialog-title-3021"
          onClose={() => setSelectedTravel(null)}
        >
          <aside className="drawer trip-detail" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">{selectedTravel.country.toUpperCase()}</p>
                <h2 id="dialog-title-3021">{selectedTravel.title}</h2>
              </div>
              <button
                aria-label="Sluiten"
                className="close"
                onClick={() => setSelectedTravel(null)}
              >
                ×
              </button>
            </div>
            <div className="trip-banner">
              <Icon name="plane" size={28} />
              <div>
                <small>Reisperiode</small>
                <b>{selectedTravel.dates}</b>
              </div>
              <Badge tone={selectedTravel.available ? 'success' : 'warning'}>
                {selectedTravel.availabilityLabel}
              </Badge>
            </div>
            <div className="detail-grid">
              <div>
                <small>Prijs per persoon</small>
                <b>
                  {formatTravelPrice(getTravelPricePerPerson(selectedTravel, draft.travellers))}
                </b>
              </div>
              <div>
                <small>Reisduur</small>
                <b>{selectedTravel.duration} dagen</b>
              </div>
              <div>
                <small>Beoordeling</small>
                <b>{selectedTravel.rating.toLocaleString('nl-NL')} / 5</b>
              </div>
              <div>
                <small>Max. reizigers</small>
                <b>{selectedTravel.maxTravellers} personen</b>
              </div>
            </div>
            <div className="travel-tax-summary">
              <div className="form-section-title">
                <div>
                  <h3>Prijs, BTW en heffingen</h3>
                  <p>
                    {selectedSearchCustomerType === 'business'
                      ? 'Zakelijke prijsopbouw met afzonderlijke BTW-specificatie.'
                      : 'Particuliere totaalprijs inclusief BTW.'}
                  </p>
                </div>
                <Badge tone={selectedSearchCustomerType === 'business' ? 'info' : 'neutral'}>
                  {selectedSearchCustomerType === 'business' ? 'Zakelijk' : 'Particulier'}
                </Badge>
              </div>
              {(() => {
                const gross = getTravelTotal(selectedTravel, draft.travellers)
                const vat = Math.round(gross - gross / 1.21)
                return selectedSearchCustomerType === 'business' ? (
                  <>
                    <div>
                      <span>Basisprijs excl. BTW</span>
                      <b>{formatTravelPrice(gross - vat)}</b>
                    </div>
                    <div>
                      <span>BTW (configureerbaar, standaard 21%)</span>
                      <b>{formatTravelPrice(vat)}</b>
                    </div>
                    <div className="total">
                      <span>Totale reissom incl. BTW</span>
                      <strong>{formatTravelPrice(gross)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span>Basisprijs incl. BTW</span>
                      <b>{formatTravelPrice(gross)}</b>
                    </div>
                    <div>
                      <span>Waarvan BTW</span>
                      <b>{formatTravelPrice(vat)}</b>
                    </div>
                    <div className="total">
                      <span>Totale reissom</span>
                      <strong>{formatTravelPrice(gross)}</strong>
                    </div>
                  </>
                )
              })()}
              {getDestinationFees(selectedTravel, destinationFeeLabels).map((fee) => (
                <div className="travel-fee-line" key={fee.id}>
                  <span>
                    <b>{fee.label}</b>
                    <small>{fee.description}</small>
                  </span>
                  <strong>
                    {fee.payment === 'included' ? 'Inbegrepen' : 'Ter plaatse · configureerbaar'}
                  </strong>
                </div>
              ))}
            </div>
            <h3>Inbegrepen</h3>
            <div className="detail-facilities">
              {selectedTravel.facilities.map((facility) => (
                <span key={facility}>
                  <Icon name="check" size={14} />
                  {facility}
                </span>
              ))}
            </div>
            <div
              className={`availability availability-${selectedTravel.available ? 'available' : 'unavailable'}`}
            >
              <span>
                <Icon name={selectedTravel.available ? 'check' : 'clock'} size={17} />
              </span>
              <div>
                <b>
                  {selectedTravelNearlyFull
                    ? `Nog ${selectedTravel.remainingSpots} plekken beschikbaar`
                    : selectedTravel.available
                      ? 'Deze reis is beschikbaar'
                      : 'Deze reis is niet meer beschikbaar'}
                </b>
                <small>
                  {selectedTravelNearlyFull
                    ? 'Deze reis is bijna vol. Hieronder staan alternatieven die bij dezelfde zoekopdracht passen.'
                    : selectedTravel.available
                      ? 'De beschikbaarheid is automatisch gecontroleerd.'
                      : 'Dit is oud aanbod. Bekijk hieronder passende alternatieven.'}
                </small>
              </div>
            </div>
            {(!selectedTravel.available || selectedTravelNearlyFull) && (
              <div className="travel-alternatives">
                <h3>
                  {selectedTravelNearlyFull
                    ? 'Alternatieven voor dezelfde zoekopdracht'
                    : 'Passende alternatieven'}
                </h3>
                {alternatives.length === 0 && (
                  <p>
                    Geen beschikbare alternatieven die aan alle zoekcriteria voldoen. Pas de
                    zoekfilters aan om meer reizen te bekijken.
                  </p>
                )}
                {alternatives.map((travel) => (
                  <button
                    key={travel.id}
                    onClick={() => {
                      setSelectedTravel(travel)
                    }}
                  >
                    <span>
                      <b>{travel.title}</b>
                      <small>
                        {travel.destination} · {travel.duration} dagen
                      </small>
                    </span>
                    <strong>
                      {formatTravelPrice(getTravelPricePerPerson(travel, draft.travellers))} p.p.
                    </strong>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            )}
            <div className="drawer-actions">
              <Button variant="secondary" onClick={() => setSelectedTravel(null)}>
                Terug naar resultaten
              </Button>
              <Button
                disabled={Boolean(
                  searchError || travelCapacityError(selectedTravel, draft.travellers),
                )}
                onClick={() => {
                  if (searchError || travelCapacityError(selectedTravel, draft.travellers)) return
                  selectForQuote({
                    travelId: selectedTravel.id,
                    travellers: draft.travellers,
                    departure: selectedTravel.startDate,
                    returnDate: selectedTravel.endDate,
                    customerEmail: selectedSearchCustomer?.email,
                    customerId: selectedSearchCustomer?.id,
                    budget: selectedSearchWish?.budget,
                  })
                }}
              >
                Reis kiezen
              </Button>
            </div>
          </aside>
        </Dialog>
      )}
      {showComparison && (
        <Dialog
          className="overlay"
          titleId="dialog-title-3217"
          onClose={() => setShowComparison(false)}
        >
          <div className="modal compare-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">REIZEN VERGELIJKEN</p>
                <h2 id="dialog-title-3217">{comparedTravels.length} reizen naast elkaar</h2>
              </div>
              <button
                aria-label="Sluiten"
                className="close"
                onClick={() => setShowComparison(false)}
              >
                ×
              </button>
            </div>
            <div className="compare-grid">
              {comparedTravels.map((travel) => (
                <article key={travel.id}>
                  <button className="inline-action" onClick={() => toggleCompare(travel.id)}>
                    Verwijderen
                  </button>
                  <h3>{travel.title}</h3>
                  <p>{travel.destination}</p>
                  <dl>
                    <dt>Prijs</dt>
                    <dd>
                      {formatTravelPrice(getTravelPricePerPerson(travel, draft.travellers))} p.p.
                    </dd>
                    <dt>Reisduur</dt>
                    <dd>{travel.duration} dagen</dd>
                    <dt>Beoordeling</dt>
                    <dd>{travel.rating.toLocaleString('nl-NL')} / 5</dd>
                    <dt>Beschikbaarheid</dt>
                    <dd>{travel.availabilityLabel}</dd>
                    <dt>Faciliteiten</dt>
                    <dd>{travel.facilities.join(', ')}</dd>
                  </dl>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedTravel(travel)
                      setShowComparison(false)
                    }}
                  >
                    Bekijk reis
                  </Button>
                </article>
              ))}
            </div>
            {comparedTravels.length === 0 && (
              <p className="compare-empty">
                Voeg reizen vanuit de zoekresultaten toe aan de vergelijking.
              </p>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}

const VoyageDataContext = createContext<VoyageVistaData | null>(null)

function useVoyageData() {
  const data = useContext(VoyageDataContext)
  if (!data) throw new Error('Voyage Vista data ontbreekt.')
  return data
}

function Customers({
  searchTripsForCustomer,
  openBooking,
  initialQuestionId,
}: {
  searchTripsForCustomer: (email: string, question?: CustomerQuestion) => void
  openBooking: (booking: Booking) => void
  initialQuestionId?: string
}) {
  const { bookings, customers, initialCustomerQuestions, travelWishes, travelProposals, user } =
    useVoyageData()
  const mutation = useMutation()
  const [questions, setQuestions] = useBackendState(initialCustomerQuestions)
  const [customerOptions, setCustomerOptions] = useBackendState(customers)
  const [selectedId, setSelectedId] = useState(
    initialQuestionId ?? initialCustomerQuestions[0]?.id ?? '',
  )
  useEffect(() => {
    if (initialQuestionId) {
      setSelectedId(initialQuestionId)
      setStatusFilter('all')
      setQuery('')
    }
  }, [initialQuestionId])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [reply, setReply] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [specialist, setSpecialist] = useState('')
  const sending = mutation.pending
  const [showBooking, setShowBooking] = useState(false)
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [addingQuestionCustomer, setAddingQuestionCustomer] = useState(false)
  const [newQuestionCustomer, setNewQuestionCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [newQuestion, setNewQuestion] = useState({
    customerId: customers[0]?.id,
    customerEmail: customers[0]?.email ?? '',
    subject: '',
    category: 'Reisadvies',
    message: '',
  })

  const [allBookings] = useBackendState(bookings)
  const filteredQuestions = questions.filter((question) => {
    const questionCustomer = findCustomer(
      customerOptions,
      question.customerId ?? question.customerEmail,
    )
    const matchesQuery =
      `${question.subject} ${question.id} ${question.category} ${questionCustomer?.name ?? ''} ${questionCustomer?.email ?? question.customerEmail}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open'
        ? question.status !== 'Afgesloten'
        : question.status === statusFilter)
    return matchesQuery && matchesStatus
  })
  const selected =
    filteredQuestions.find((question) => question.id === selectedId) ?? filteredQuestions[0]
  const customer = findCustomer(
    customerOptions,
    selected?.customerId ?? selected?.customerEmail,
  ) ?? { name: 'Onbekende klant', email: '', phone: '' }
  const linkedBooking = allBookings.find((booking) => booking.id === selected?.bookingId)
  useEffect(() => {
    setReply('')
    setInternalNote(false)
    setSpecialist('')
    setShowBooking(false)
    setProfileExpanded(false)
  }, [selected?.id])
  const openCount = questions.filter((question) => question.status !== 'Afgesloten').length
  const urgentCount = questions.filter(
    (question) => question.priority === 'Urgent' && question.status !== 'Afgesloten',
  ).length

  const selectQuestion = (id: string) => {
    if (mutation.pending) return
    setSelectedId(id)
    setReply('')
    setInternalNote(false)
    setSpecialist('')
    setShowBooking(false)
    const question = questions.find((item) => item.id === id)
    if (question?.status === 'Nieuw')
      void mutation.run(() => updateQuestionAction({ id, status: 'In behandeling', unread: false }))
  }

  const forwardQuestion = () => {
    if (!selected || !specialist) return
    void mutation.run(
      () => updateQuestionAction({ id: selected.id, specialist, status: 'Doorgestuurd' }),
      () => setSpecialist(''),
    )
  }

  const sendReply = () => {
    if (!selected || !reply.trim()) return
    void mutation.run(
      () =>
        addQuestionMessageAction({
          questionId: selected.id,
          kind: internalNote ? 'internalNote' : 'staffReply',
          body: reply.trim(),
        }),
      () => {
        setReply('')
        setInternalNote(false)
      },
    )
  }

  const closeQuestion = () => {
    if (!selected) return
    void mutation.run(() =>
      updateQuestionAction({ id: selected.id, status: 'Afgesloten', unread: false }),
    )
  }

  const addQuestion = () => {
    if (
      addingQuestionCustomer ||
      !newQuestion.customerEmail ||
      !newQuestion.subject.trim() ||
      !newQuestion.message.trim()
    )
      return
    const question: CustomerQuestion = {
      id: `KV-${1055 + questions.length}`,
      customerId: newQuestion.customerId,
      customerEmail: newQuestion.customerEmail,
      subject: newQuestion.subject.trim(),
      category: newQuestion.category,
      channel: 'Handmatig',
      priority: 'Normaal',
      status: 'Nieuw',
      received: 'Zojuist',
      unread: true,
      message: newQuestion.message.trim(),
      destination: 'Nog te bepalen',
      period: 'Nog te bepalen',
      travellers: 'Onbekend',
      budget: 'Onbekend',
      notes: [],
    }
    void mutation.run(
      () => createQuestionAction(question),
      (result) => {
        if (result.reference) setSelectedId(result.reference)
        setNewQuestion({
          customerId: customers[0]?.id,
          customerEmail: customers[0]?.email ?? '',
          subject: '',
          category: 'Reisadvies',
          message: '',
        })
        setAddingQuestion(false)
      },
    )
  }

  const addQuestionCustomer = () => {
    if (
      !newQuestionCustomer.name.trim() ||
      !isValidEmail(newQuestionCustomer.email) ||
      !newQuestionCustomer.phone.trim()
    )
      return
    const customer: Customer = {
      name: newQuestionCustomer.name.trim(),
      email: newQuestionCustomer.email.trim(),
      phone: newQuestionCustomer.phone.trim(),
    }
    void mutation.run(
      () => saveCustomerAction(customer),
      (result) => {
        customer.id = result.reference
        setCustomerOptions((current) => [customer, ...current])
        setNewQuestion((current) => ({
          ...current,
          customerId: customer.id,
          customerEmail: customer.email,
        }))
        setNewQuestionCustomer({ name: '', email: '', phone: '' })
        setAddingQuestionCustomer(false)
      },
    )
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">KLANTCONTACT</p>
          <h1>Klantvragen</h1>
          <p>Behandel reisadvies, boekingswijzigingen, documenten, klachten en urgente vragen.</p>
        </div>
        <Button icon="plus" disabled={mutation.pending} onClick={() => setAddingQuestion(true)}>
          Klantvraag toevoegen
        </Button>
      </section>
      <ErrorNotice message={mutation.error} />
      <section className="customer-question-metrics">
        <div>
          <small>Open vragen</small>
          <strong>{openCount}</strong>
        </div>
        <div>
          <small>Urgent</small>
          <strong>{urgentCount}</strong>
        </div>
        <div>
          <small>Beantwoord</small>
          <strong>{questions.filter((question) => question.status === 'Beantwoord').length}</strong>
        </div>
        <div>
          <small>Totaal vragen</small>
          <strong>{questions.length}</strong>
        </div>
      </section>
      <section className="inbox customer-inbox">
        <aside className="question-list">
          <div className="question-list-tools">
            <label htmlFor="question-search" className="mb-2! block! text-sm!">
              Zoek klantvraag
            </label>
            <div className="search">
              <Icon name="search" />
              <input
                id="question-search"
                disabled={mutation.pending}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek klantvraag"
              />
            </div>
            <label htmlFor="question-status" className="mb-2! block! text-sm!">
              Status
            </label>
            <select
              id="question-status"
              disabled={mutation.pending}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="open">Open vragen</option>
              <option value="all">Alle vragen</option>
              <option value="Nieuw">Nieuw</option>
              <option value="In behandeling">In behandeling</option>
              <option value="Doorgestuurd">Doorgestuurd</option>
              <option value="Beantwoord">Beantwoord</option>
              <option value="Afgesloten">Afgesloten</option>
            </select>
          </div>
          {filteredQuestions.map((question) => {
            const itemCustomer = findCustomer(
              customerOptions,
              question.customerId ?? question.customerEmail,
            ) ?? { name: 'Onbekende klant', email: '', phone: '' }
            return (
              <button
                className={`message ${question.id === selected.id ? 'selected' : ''}`}
                key={question.id}
                disabled={mutation.pending}
                onClick={() => selectQuestion(question.id)}
              >
                <span className="avatar">
                  {itemCustomer.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span>
                  <b>{itemCustomer.name}</b>
                  <small>{question.subject}</small>
                  <em>
                    {question.category} · {question.status}
                  </em>
                </span>
                <time>{question.received}</time>
                {question.unread && <i />}
              </button>
            )
          })}
          {filteredQuestions.length === 0 && (
            <p className="question-list-empty">Geen klantvragen gevonden.</p>
          )}
        </aside>
        {selected ? (
          <article className="conversation customer-conversation max-[900px]:h-auto!">
            <div className="conversation-head">
              <span className="avatar big">
                {customer.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div>
                <h2>{customer.name}</h2>
                <p>
                  {selected.id} · {selected.channel} · ontvangen {selected.received}
                </p>
              </div>
              <Badge
                tone={
                  selected.priority === 'Urgent'
                    ? 'warning'
                    : selected.status === 'Afgesloten'
                      ? 'neutral'
                      : 'info'
                }
              >
                {selected.priority === 'Normaal'
                  ? selected.status
                  : `${selected.priority} · ${selected.status}`}
              </Badge>
              <Button variant="secondary" onClick={() => setProfileExpanded(!profileExpanded)}>
                Klantprofiel
              </Button>
            </div>
            <div className="question-subject">
              <div>
                <span>{selected.category}</span>
                <h3>{selected.subject}</h3>
              </div>
              {selected.departure && <strong>Vertrek {selected.departure}</strong>}
            </div>
            <div className="conversation-scroll">
              <div className="message-body">
                <p>{selected.message}</p>
                <small>
                  {selected.received} · via {selected.channel}
                </small>
              </div>
              {selected.lastReply && (
                <div className="message-body outgoing">
                  <p>{selected.lastReply}</p>
                  <small>Verstuurd door {user.name} · zojuist</small>
                </div>
              )}
              <div className="extracted">
                <p>
                  <Icon name="cpu" size={16} /> Automatisch herkende reisgegevens
                </p>
                <div>
                  <span>
                    <small>Bestemming</small>
                    <b>{selected.destination}</b>
                  </span>
                  <span>
                    <small>Periode</small>
                    <b>{selected.period}</b>
                  </span>
                  <span>
                    <small>Reizigers</small>
                    <b>{selected.travellers}</b>
                  </span>
                  <span>
                    <small>Budget</small>
                    <b>{selected.budget}</b>
                  </span>
                </div>
              </div>
              {selected.notes.length > 0 && (
                <div className="internal-notes">
                  <h3>Interne notities</h3>
                  {selected.notes.map((note, index) => (
                    <p key={`${note}-${index}`}>
                      <Icon name="file" size={14} />
                      {note}
                    </p>
                  ))}
                </div>
              )}
              {showBooking && linkedBooking && (
                <div className="booking-context">
                  <div>
                    <p className="eyebrow">GEKOPPELDE BOEKING</p>
                    <h3>{linkedBooking.trip}</h3>
                    <span>
                      {linkedBooking.id} · {linkedBooking.date}
                    </span>
                  </div>
                  <div>
                    <b>{linkedBooking.amount}</b>
                    <Badge tone={linkedBooking.status === 'Bevestigd' ? 'success' : 'warning'}>
                      {linkedBooking.status}
                    </Badge>
                  </div>
                  <Button variant="secondary" onClick={() => openBooking(linkedBooking)}>
                    Volledige boeking
                  </Button>
                </div>
              )}
              {profileExpanded && (
                <div className="profile-context">
                  <h3>Klantprofiel</h3>
                  <div>
                    <span>
                      <small>E-mail</small>
                      <b>{customer.email}</b>
                    </span>
                    <span>
                      <small>Telefoon</small>
                      <b>{customer.phone}</b>
                    </span>
                    <span>
                      <small>Opgeslagen budget</small>
                      <b>{travelWishes[profileKey(customer)]?.budget ?? 'Niet ingesteld'}</b>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={`reply ${internalNote ? 'note-mode' : ''}`}>
              <label htmlFor="question-reply" className="mb-2! block! text-sm!">
                {internalNote ? 'Interne notitie' : 'Antwoord aan de klant'}
              </label>
              <textarea
                id="question-reply"
                disabled={mutation.pending || selected.status === 'Afgesloten'}
                maxLength={5000}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={
                  internalNote
                    ? 'Schrijf een interne notitie…'
                    : `Schrijf een antwoord aan ${customer.name.split(' ')[0]}…`
                }
              />
              <div>
                <button
                  className={`text-button ${internalNote ? 'active' : ''}`}
                  disabled={mutation.pending || selected.status === 'Afgesloten'}
                  onClick={() => setInternalNote(!internalNote)}
                >
                  {internalNote ? 'Interne notitie actief' : 'Interne notitie'}
                </button>
                <Button
                  disabled={!reply.trim() || sending || selected.status === 'Afgesloten'}
                  onClick={sendReply}
                >
                  {sending ? 'Versturen…' : internalNote ? 'Notitie opslaan' : 'Antwoord versturen'}
                </Button>
              </div>
            </div>
          </article>
        ) : (
          <div className="p-8">
            <h2>{questions.length ? 'Geen passende klantvragen' : 'Geen klantvragen'}</h2>
            <p>
              {questions.length
                ? 'Pas je zoekopdracht of statusfilter aan.'
                : 'Nieuwe vragen verschijnen hier. Je kunt ook zelf een klantvraag toevoegen.'}
            </p>
          </div>
        )}
        {selected && (
          <aside className="customer-side question-actions">
            <div>
              <p className="eyebrow">VOLGENDE ACTIE</p>
              <h3>
                {selected.status === 'Afgesloten'
                  ? 'Vraag afgehandeld'
                  : selected.specialist
                    ? `Bij ${selected.specialist}`
                    : 'Vraag onderzoeken'}
              </h3>
              <p>
                {selected.status === 'Afgesloten'
                  ? 'De klantvraag is gesloten en het klantprofiel is bijgewerkt.'
                  : 'Controleer klant- en boekingsgegevens voordat je antwoordt.'}
              </p>
            </div>
            {selected.bookingId ? (
              <>
                <Button variant="secondary" onClick={() => setShowBooking(!showBooking)}>
                  {showBooking ? 'Boeking verbergen' : 'Boeking raadplegen'}
                </Button>
              </>
            ) : (
              <Button
                icon="search"
                disabled={mutation.pending}
                onClick={() => searchTripsForCustomer(profileKey(customer), selected)}
              >
                Reis zoeken
              </Button>
            )}
            <hr />
            <h3>Doorsturen specialist</h3>
            <label htmlFor="question-specialist" className="block! text-sm!">
              Specialist of afdeling
            </label>
            <select
              id="question-specialist"
              value={specialist}
              onChange={(event) => setSpecialist(event.target.value)}
              disabled={mutation.pending || selected.status === 'Afgesloten'}
            >
              <option value="">Kies specialist</option>
              <option>Reisdocumenten</option>
              <option>Boekingsspecialist</option>
              <option>Calamiteiten</option>
              <option>Klachtenafhandeling</option>
              <option>Verzekeringen</option>
            </select>
            <Button
              variant="secondary"
              disabled={mutation.pending || !specialist || selected.status === 'Afgesloten'}
              onClick={forwardQuestion}
            >
              Doorsturen
            </Button>
            <hr />
            <h3>Vraaggegevens</h3>
            <dl>
              <dt>Categorie</dt>
              <dd>{selected.category}</dd>
              <dt>Kanaal</dt>
              <dd>{selected.channel}</dd>
              <dt>Prioriteit</dt>
              <dd>{selected.priority}</dd>
              <dt>SLA</dt>
              <dd>
                {selected.priority === 'Urgent'
                  ? 'Reageren binnen 30 min'
                  : selected.priority === 'Hoog'
                    ? 'Reageren binnen 2 uur'
                    : 'Reageren vandaag'}
              </dd>
              {selected.bookingId && (
                <>
                  <dt>Boeking</dt>
                  <dd>{selected.bookingId}</dd>
                </>
              )}
              <dt>Specialist</dt>
              <dd>{selected.specialist ?? 'Niet toegewezen'}</dd>
            </dl>
            {selected.status !== 'Afgesloten' && (
              <Button
                variant="secondary"
                disabled={
                  mutation.pending || (selected.status !== 'Beantwoord' && !selected.specialist)
                }
                onClick={closeQuestion}
              >
                Klantvraag afsluiten
              </Button>
            )}
          </aside>
        )}
      </section>
      {addingQuestion && (
        <Dialog
          className="overlay"
          titleId="dialog-title-3794"
          onClose={() => {
            if (!mutation.pending) setAddingQuestion(false)
          }}
        >
          <div className="modal question-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">NIEUWE KLANTVRAAG</p>
                <h2 id="dialog-title-3794">Klantvraag registreren</h2>
              </div>
              <button
                aria-label="Sluiten"
                className="close"
                disabled={mutation.pending}
                onClick={() => setAddingQuestion(false)}
              >
                ×
              </button>
            </div>
            <div className="form-content">
              <ErrorNotice message={mutation.error} />
              <div className="form-section-title">
                <div>
                  <h3>Klant koppelen</h3>
                  <p>Selecteer een bestaande klant of registreer direct een nieuwe klant.</p>
                </div>
                <button
                  className="inline-action"
                  disabled={mutation.pending}
                  onClick={() => setAddingQuestionCustomer(!addingQuestionCustomer)}
                >
                  <Icon name="plus" size={15} />
                  {addingQuestionCustomer ? 'Bestaande klant kiezen' : 'Nieuwe klant toevoegen'}
                </button>
              </div>
              {addingQuestionCustomer ? (
                <div className="new-customer-form question-new-customer">
                  <label>
                    Naam
                    <input
                      value={newQuestionCustomer.name}
                      maxLength={120}
                      disabled={mutation.pending}
                      onChange={(event) =>
                        setNewQuestionCustomer({ ...newQuestionCustomer, name: event.target.value })
                      }
                      placeholder="Voor- en achternaam"
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      type="email"
                      maxLength={254}
                      disabled={mutation.pending}
                      value={newQuestionCustomer.email}
                      aria-invalid={Boolean(
                        newQuestionCustomer.email && !isValidEmail(newQuestionCustomer.email),
                      )}
                      aria-describedby="question-email-error"
                      onChange={(event) =>
                        setNewQuestionCustomer({
                          ...newQuestionCustomer,
                          email: event.target.value,
                        })
                      }
                      placeholder="naam@email.nl"
                    />
                    <FieldError
                      id="question-email-error"
                      message={
                        newQuestionCustomer.email && !isValidEmail(newQuestionCustomer.email)
                          ? 'Vul een geldig e-mailadres in, bijvoorbeeld naam@example.nl.'
                          : ''
                      }
                    />
                  </label>
                  <label>
                    Telefoonnummer
                    <input
                      value={newQuestionCustomer.phone}
                      maxLength={80}
                      disabled={mutation.pending}
                      onChange={(event) =>
                        setNewQuestionCustomer({
                          ...newQuestionCustomer,
                          phone: event.target.value,
                        })
                      }
                      placeholder="06 12 34 56 78"
                    />
                  </label>
                  <div>
                    <Button
                      variant="secondary"
                      disabled={mutation.pending}
                      onClick={() => setAddingQuestionCustomer(false)}
                    >
                      Annuleren
                    </Button>
                    <Button
                      disabled={
                        mutation.pending ||
                        !newQuestionCustomer.name.trim() ||
                        !isValidEmail(newQuestionCustomer.email) ||
                        !newQuestionCustomer.phone.trim()
                      }
                      onClick={addQuestionCustomer}
                    >
                      Klant toevoegen en koppelen
                    </Button>
                  </div>
                </div>
              ) : (
                <label>
                  Klant
                  <select
                    value={newQuestion.customerId ?? newQuestion.customerEmail}
                    disabled={mutation.pending}
                    onChange={(event) =>
                      setNewQuestion({
                        ...newQuestion,
                        customerId: findCustomer(customerOptions, event.target.value)?.id,
                        customerEmail:
                          findCustomer(customerOptions, event.target.value)?.email ?? '',
                      })
                    }
                  >
                    {customerOptions.map((item) => (
                      <option value={profileKey(item)} key={profileKey(item)}>
                        {item.name} · {item.email}
                        {item.accountProfile ? ' · App-account' : ''} · {item.id?.slice(-6)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="form-row">
                <label>
                  Categorie
                  <select
                    value={newQuestion.category}
                    disabled={mutation.pending}
                    onChange={(event) =>
                      setNewQuestion({ ...newQuestion, category: event.target.value })
                    }
                  >
                    <option>Reisadvies</option>
                    <option>Boekingswijziging</option>
                    <option>Reisdocumenten</option>
                    <option>Betaling</option>
                    <option>Klacht</option>
                    <option>Calamiteit</option>
                  </select>
                </label>
                <label>
                  Onderwerp
                  <input
                    value={newQuestion.subject}
                    maxLength={200}
                    disabled={mutation.pending}
                    onChange={(event) =>
                      setNewQuestion({ ...newQuestion, subject: event.target.value })
                    }
                    placeholder="Kort onderwerp"
                  />
                </label>
              </div>
              <label>
                Vraag
                <textarea
                  value={newQuestion.message}
                  maxLength={5000}
                  disabled={mutation.pending}
                  onChange={(event) =>
                    setNewQuestion({ ...newQuestion, message: event.target.value })
                  }
                  placeholder="Beschrijf de klantvraag"
                />
              </label>
            </div>
            <div className="modal-actions">
              <Button
                variant="secondary"
                disabled={mutation.pending}
                onClick={() => setAddingQuestion(false)}
              >
                Annuleren
              </Button>
              <Button
                disabled={
                  mutation.pending ||
                  addingQuestionCustomer ||
                  !newQuestion.customerEmail ||
                  !newQuestion.subject.trim() ||
                  !newQuestion.message.trim()
                }
                onClick={addQuestion}
              >
                Klantvraag toevoegen
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}

function TravelPhoto({
  travel,
  alt,
  eager = false,
}: {
  travel?: Travel
  alt: string
  eager?: boolean
}) {
  return travel?.image ? (
    <Image
      src={travel.image}
      alt={alt}
      width={1200}
      height={800}
      loading={eager ? 'eager' : 'lazy'}
      sizes="(max-width: 700px) 100vw, 500px"
    />
  ) : (
    <div
      className="flex min-h-48 items-center justify-center bg-[var(--vv-subtle)] p-6 text-[var(--vv-muted)]"
      role="img"
      aria-label={alt}
    >
      Reisfoto volgt
    </div>
  )
}

function CustomerPortal({ trips }: { trips: PublicTravel[] }) {
  const {
    bookings,
    customers,
    favoriteTravelIds,
    initialCustomerQuestions,
    quotes,
    travelProposals,
    user,
  } = useVoyageData()
  const mutation = useMutation()
  const [tab, setTab] = useState<
    'discover' | 'trip' | 'favorites' | 'contact' | 'wish' | 'booking'
  >('discover')
  const [checkoutTravel, setCheckoutTravel] = useState<Travel | null>(null)
  useEffect(() => {
    const url = new URL(window.location.href)
    let stored: string | null = null
    try {
      stored = sessionStorage.getItem('voyage-intent')
      sessionStorage.removeItem('voyage-intent')
    } catch {
      /* Storage is optional. */
    }
    const target =
      url.searchParams.get('next') === 'reiswens'
        ? 'reiswens'
        : url.searchParams.get('trip') || stored
    if (!target) return
    url.searchParams.delete('next')
    url.searchParams.delete('trip')
    window.history.replaceState(null, '', url)
    if (target === 'reiswens') setTab('wish')
    else {
      const travel = travelProposals.find((item) => item.catalogId === target)
      if (travel) {
        setCheckoutTravel(travel)
        setTab('booking')
      }
    }
  }, [travelProposals])
  const [travellers, setTravellers] = useState(2)
  const [maxBudget, setMaxBudget] = useState('')
  const [favorites, setFavorites] = useBackendState(favoriteTravelIds)
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [contactSubject, setContactSubject] = useState('Reisadvies')
  const [questions, setQuestions] = useBackendState(initialCustomerQuestions)
  const [bookingItems] = useBackendState(bookings)
  const [customerQuotes] = useBackendState(quotes)
  const [reviewQuote, setReviewQuote] = useState<QuoteItem | null>(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [activeBookingId, setActiveBookingId] = useState(bookings[0]?.id ?? '')
  const myBooking = bookingItems.find((booking) => booking.id === activeBookingId) ??
    bookings[0] ?? {
      id: '',
      customer: customers[0]?.name ?? '',
      trip: '',
      date: '',
      amount: '',
      status: 'Geen boeking',
    }
  const myTravel = travelProposals.find((travel) => travel.title === myBooking.trip)
  const paid = myBooking.status === 'Bevestigd'
  const submitQuestion = (travel?: Travel) => {
    if (travel && travelCapacityError(travel, travellers)) return
    const question: CustomerQuestion = {
      id: `KV-${Date.now()}`,
      customerEmail: customers[0]?.email ?? '',
      subject: travel ? `Reisaanvraag: ${travel.title}` : contactSubject,
      category: travel ? 'Reisadvies' : contactSubject,
      channel: 'Website',
      priority: 'Normaal',
      status: 'Nieuw',
      received: 'Zojuist',
      unread: true,
      message: travel
        ? `Ik ontvang graag een reisvoorstel voor ${travel.title}, voor ${travellers} personen. Totaalbudget: ${maxBudget ? formatTravelPrice(Number(maxBudget)) : 'in overleg'}.`
        : contactMessage.trim(),
      destination: travel?.destination ?? '—',
      travelId: travel?.id,
      startDate: travel?.startDate,
      endDate: travel?.endDate,
      period: travel?.dates ?? '—',
      travellers: `${travellers} personen`,
      budget: maxBudget ? formatTravelPrice(Number(maxBudget)) : '—',
      notes: [],
    }
    void mutation.run(
      () => createQuestionAction({ ...question, travellers }),
      () => {
        if (travel) setRequestSent(true)
        else {
          setContactSent(true)
          setContactMessage('')
        }
      },
    )
  }

  const toggleFavorite = (id: string) => {
    void mutation.run(() => toggleFavoriteAction(id))
  }

  const visibleTravels = travelProposals.filter((travel) => favorites.includes(travel.id))

  const accountNavigation = (
    <>
      {(
        [
          ['discover', 'Onze reizen'],
          ['trip', 'Mijn reis'],
          ['favorites', `Favorieten (${favorites.length})`],
          ['wish', 'Reiswens indienen'],
          ['contact', 'Contact'],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-current={tab === id ? 'page' : undefined}
          className="min-h-11! w-auto! rounded-lg! border-0! bg-transparent! px-3! py-2! text-sm! font-bold! text-white! hover:bg-white/10! aria-[current=page]:text-[var(--vv-mint)]! aria-[current=page]:underline! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-mint)]!"
          onClick={() => setTab(id)}
        >
          {label}
        </button>
      ))}
      <span className="text-sm! text-white!">Welkom, {user.name.split(' ')[0]}</span>
      <LogoutButton className="button button-secondary w-auto!" />
    </>
  )

  return (
    <div className="customer-portal">
      {tab === 'discover' ? (
        <PublicHome
          trips={trips}
          navigation={accountNavigation}
          onTravelWish={() => setTab('wish')}
          onRequestTrip={(trip) => {
            const travel = travelProposals.find((item) => item.catalogId === trip.id)
            if (travel) {
              setSelectedTravel(travel)
              setRequestSent(false)
            } else {
              setTab('contact')
            }
          }}
        />
      ) : (
        <PublicHeader>{accountNavigation}</PublicHeader>
      )}
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <ErrorNotice message={mutation.error} />
      </div>
      <main
        hidden={tab !== 'wish'}
        className={`customer-main customer-subpage ${tab !== 'wish' ? 'hidden!' : ''}`}
      >
        <section className="page-heading">
          <div>
            <p className="eyebrow">REIS OP MAAT</p>
            <h1>Jouw reiswens</h1>
            <p>
              Geen passende reis gevonden? Vertel ons wat je zoekt. Je specialist maakt een
              persoonlijk voorstel.
            </p>
          </div>
        </section>
        <TravelWishForm onCancel={() => setTab('discover')} onHistory={() => setTab('trip')} />
      </main>
      {tab === 'booking' && checkoutTravel && (
        <main className="customer-main customer-subpage">
          <section className="page-heading">
            <div>
              <p className="eyebrow">JOUW VOLGENDE REIS</p>
              <h1>Controleer je boeking</h1>
              <p>Controleer het pakket en de reissom voordat je boekt.</p>
            </div>
          </section>
          <BookingCheckout
            key={checkoutTravel.id}
            travel={checkoutTravel}
            initialTravellers={travellers}
            name={user.name}
            email={user.email}
            onCancel={() => setTab('discover')}
            onBooked={(reference) => {
              setActiveBookingId(reference)
              setTab('trip')
            }}
          />
        </main>
      )}
      {tab === 'favorites' && (
        <main className="customer-main customer-subpage">
          <section className="page-heading">
            <div>
              <p className="eyebrow">BEWAARD</p>
              <h1>Mijn favorieten</h1>
              <p>Vergelijk je bewaarde reizen en boek zodra je er klaar voor bent.</p>
            </div>
          </section>
          <section className="customer-travel-grid">
            {visibleTravels.map((travel, index) => (
              <article key={travel.id}>
                <div className="customer-travel-image">
                  <TravelPhoto
                    travel={travel}
                    alt={`${travel.destination} reisbestemming`}
                    eager={index === 0}
                  />
                  <button
                    className="favorite active"
                    aria-label={`Verwijder ${travel.title} uit favorieten`}
                    onClick={() => toggleFavorite(travel.id)}
                  >
                    ♡
                  </button>
                </div>
                <div className="customer-travel-copy">
                  <p>{travel.country}</p>
                  <h3>{travel.title}</h3>
                  <div>
                    <small>vanaf</small>
                    <strong>
                      {formatTravelPrice(getTravelPricePerPerson(travel, travellers))} p.p.
                    </strong>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedTravel(travel)
                      setRequestSent(false)
                    }}
                  >
                    Bekijk reis
                  </Button>
                </div>
              </article>
            ))}
            {visibleTravels.length === 0 && (
              <div className="customer-empty">
                <h3>Nog geen favorieten</h3>
                <p>Bewaar reizen vanuit Reizen ontdekken.</p>
                <Button onClick={() => setTab('discover')}>Reizen ontdekken</Button>
              </div>
            )}
          </section>
        </main>
      )}
      {tab === 'trip' && (
        <main className="customer-main customer-subpage">
          <section className="page-heading">
            <div>
              <p className="eyebrow">MIJN REIS</p>
              <h1>{myBooking.trip || 'Nog geen reis geboekt'}</h1>
              <p>
                {myBooking.id
                  ? `${myBooking.date} · boeking ${myBooking.id}`
                  : 'Je vindt je reis hier zodra je boeking is aangemaakt.'}
              </p>
            </div>
            <Badge tone={paid ? 'success' : 'warning'}>{myBooking.status}</Badge>
          </section>
          <section className="customer-trip-overview">
            <article>
              <p className="eyebrow">VERTREKDATUM</p>
              <strong>{myBooking.date.split('–')[0].trim()}</strong>
              <span>{myTravel?.destination}</span>
            </article>
            <article>
              <p className="eyebrow">REISSOM</p>
              <strong>{myBooking.amount || 'Nog niet bekend'}</strong>
              <span>Neem voor de betaalstatus contact op met Voyage Vista.</span>
              <Button
                disabled={!myBooking.id || myBooking.status === 'Geannuleerd'}
                onClick={() => setShowPayment(true)}
              >
                Betalingsinformatie
              </Button>
            </article>
            <article>
              <p className="eyebrow">DOCUMENTEN</p>
              <strong>Nog niet beschikbaar</strong>
              <span>Neem voor je reisdocumenten contact op met Voyage Vista.</span>
              <Button
                variant="secondary"
                disabled={!myBooking.id}
                onClick={() => setShowDocuments(true)}
              >
                Documenten bekijken
              </Button>
            </article>
          </section>
          <section className="customer-itinerary">
            <h2>Reisplanning</h2>
            {[
              [
                'Vertrek',
                'Heenreis',
                myTravel?.parts.find((part) => part.id === 'flight')?.label ??
                  'Vlucht volgens reisvoorstel',
              ],
              [
                'Verblijf',
                myTravel?.parts.find((part) => part.id === 'hotel')?.label ?? myTravel?.title,
                myBooking.date,
              ],
              ['Terugreis', 'Terug naar huis', 'Exacte vluchttijden volgen op je tickets'],
            ].map(([date, title, text]) => (
              <div key={date}>
                <span>{date}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <Icon name="check" size={18} />
              </div>
            ))}
          </section>
        </main>
      )}
      {tab === 'contact' && (
        <main className="customer-main customer-subpage">
          <section className="page-heading">
            <div>
              <p className="eyebrow">PERSOONLIJK ADVIES</p>
              <h1>Hoe kunnen we helpen?</h1>
              <p>Stel een vraag over een reis, je boeking, reisdocumenten of betalingen.</p>
            </div>
          </section>
          <section className="customer-contact-card">
            <div>
              <h2>Neem contact op</h2>
              <p>
                Stuur je vraag via je klantomgeving. Het antwoord van Voyage Vista vind je hier
                terug.
              </p>
            </div>
            <div>
              <label>
                Onderwerp
                <select
                  value={contactSubject}
                  onChange={(event) => {
                    setContactSubject(event.target.value)
                    setContactSent(false)
                  }}
                >
                  <option>Reisadvies</option>
                  <option>Mijn boeking</option>
                  <option>Reisdocumenten</option>
                  <option>Betaling</option>
                </select>
              </label>
              <label>
                Bericht
                <textarea
                  value={contactMessage}
                  onChange={(event) => {
                    setContactMessage(event.target.value)
                    setContactSent(false)
                  }}
                  placeholder="Waar kunnen we mee helpen?"
                />
              </label>
              {contactSent && (
                <div className="send-success" role="status">
                  <Icon name="check" size={17} />
                  Je vraag is verstuurd. Je vindt de status en het antwoord bij Mijn reis → Mijn
                  aanvragen.
                </div>
              )}
              <Button
                disabled={!contactMessage.trim() || contactSent || mutation.pending}
                onClick={() => submitQuestion()}
              >
                {contactSent ? 'Verstuurd' : 'Vraag versturen'}
              </Button>
            </div>
          </section>
        </main>
      )}
      {selectedTravel && (
        <Dialog
          className="overlay"
          titleId="customer-travel-title"
          onClose={() => setSelectedTravel(null)}
        >
          <aside
            className="drawer customer-travel-detail"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <p className="eyebrow">{selectedTravel.country.toUpperCase()}</p>
                <h2 id="customer-travel-title">{selectedTravel.title}</h2>
              </div>
              <button
                className="close"
                aria-label="Reisdetails sluiten"
                onClick={() => setSelectedTravel(null)}
              >
                ×
              </button>
            </div>
            <TravelPhoto
              travel={selectedTravel}
              alt={`${selectedTravel.destination} reisbestemming`}
              eager
            />
            <p>{selectedTravel.description}</p>
            <div className="detail-grid">
              <div>
                <small>Reisduur</small>
                <b>{selectedTravel.duration} nachten</b>
              </div>
              <div>
                <small>Reisperiode</small>
                <b>{selectedTravel.dates}</b>
              </div>
              <div>
                <small>Prijs voor {travellers}</small>
                <b>{formatTravelPrice(getTravelTotal(selectedTravel, travellers))}</b>
              </div>
              <div>
                <small>Beoordeling</small>
                <b>{selectedTravel.rating} / 5</b>
              </div>
            </div>
            <h3>Inbegrepen</h3>
            <div className="detail-facilities">
              {selectedTravel.facilities.map((facility) => (
                <span key={facility}>
                  <Icon name="check" size={14} />
                  {facility}
                </span>
              ))}
            </div>
            <ErrorNotice message={travelCapacityError(selectedTravel, travellers)} />
            <div className="grid gap-4 py-4">
              <label className="grid gap-2 text-sm font-bold text-[var(--vv-primary)]">
                Aantal reizigers
                <input
                  type="number"
                  min="1"
                  max={selectedTravel.maxTravellers}
                  value={travellers}
                  onChange={(event) => {
                    setTravellers(Number(event.target.value))
                    setRequestSent(false)
                  }}
                  className="min-h-11 rounded-lg border border-[var(--vv-border)] bg-white px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--vv-primary)]">
                Totaalbudget in euro (optioneel)
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(event) => {
                    setMaxBudget(event.target.value)
                    setRequestSent(false)
                  }}
                  className="min-h-11 rounded-lg border border-[var(--vv-border)] bg-white px-3"
                />
              </label>
            </div>
            {requestSent && (
              <div className="send-success" role="status">
                <Icon name="check" size={17} />
                Je reisaanvraag is verstuurd naar een reisspecialist.
              </div>
            )}
            <ErrorNotice message={mutation.error} />
            <div className="drawer-actions">
              <Button
                disabled={
                  mutation.pending || Boolean(travelCapacityError(selectedTravel, travellers))
                }
                onClick={() => {
                  setCheckoutTravel(selectedTravel)
                  setSelectedTravel(null)
                  setTab('booking')
                }}
              >
                Boek reis
              </Button>
              <Button variant="secondary" onClick={() => toggleFavorite(selectedTravel.id)}>
                {favorites.includes(selectedTravel.id) ? 'Verwijder favoriet' : 'Bewaar favoriet'}
              </Button>
              <Button
                disabled={
                  mutation.pending ||
                  requestSent ||
                  Boolean(travelCapacityError(selectedTravel, travellers))
                }
                onClick={() => submitQuestion(selectedTravel)}
              >
                {requestSent ? 'Aanvraag verstuurd' : 'Vraag reisvoorstel aan'}
              </Button>
            </div>
          </aside>
        </Dialog>
      )}
      {tab === 'trip' && (
        <section className="customer-main request-history">
          <h2>Mijn aanvragen</h2>
          <p>Je reisspecialist behandelt de volgende vragen.</p>
          {questions.map((question) => (
            <article className="document-row" key={question.id}>
              <Icon name="file" />
              <div>
                <b>{question.subject}</b>
                <small>{question.message}</small>
                {question.lastReply && (
                  <p>
                    <b>Antwoord van je reisspecialist</b>
                    <br />
                    {question.lastReply}
                  </p>
                )}
              </div>
              <Badge tone={question.status === 'Beantwoord' ? 'success' : 'info'}>
                {question.status}
              </Badge>
            </article>
          ))}
        </section>
      )}

      {tab === 'trip' && (
        <section className="customer-main request-history">
          <h2>Mijn reisvoorstellen</h2>
          <p>Bekijk de voorstellen van je reisspecialist en kies je volgende reis.</p>
          {customerQuotes
            .filter((quote) => quote.status !== 'Concept')
            .map((quote) => (
              <article className="document-row" key={quote.number}>
                <Icon name="map" />
                <div>
                  <b>{quote.destination}</b>
                  <small>
                    {quote.number} · {quote.amount} · {quote.status}
                  </small>
                </div>
                <Button variant="secondary" onClick={() => setReviewQuote(quote)}>
                  Voorstel bekijken
                </Button>
              </article>
            ))}
          {!customerQuotes.some((quote) => quote.status !== 'Concept') && (
            <div className="customer-empty">
              <h3>Je reisvoorstel volgt</h3>
              <p>Zodra je specialist een offerte verstuurt, vind je die hier.</p>
              <Button variant="secondary" onClick={() => setTab('discover')}>
                Ontdek de reizen
              </Button>
            </div>
          )}
          {bookingItems.map((booking) => (
            <article className="document-row" key={booking.id}>
              <Icon name="calendar" />
              <div>
                <b>{booking.trip}</b>
                <small>
                  {booking.id} · {booking.date} · {booking.amount}
                </small>
              </div>
              <Badge tone="info">{booking.status}</Badge>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveBookingId(booking.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Bekijk boeking
              </Button>
            </article>
          ))}
        </section>
      )}
      {reviewQuote && (
        <Dialog
          className="overlay"
          titleId="dialog-title-4492"
          onClose={() => setReviewQuote(null)}
        >
          <section className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">{reviewQuote.number}</p>
                <h2 id="dialog-title-4492">{reviewQuote.destination}</h2>
              </div>
              <button aria-label="Sluiten" className="close" onClick={() => setReviewQuote(null)}>
                ×
              </button>
            </div>
            <div className="form-content">
              <ErrorNotice message={mutation.error} />
              <Badge tone={reviewQuote.status === 'Geaccepteerd' ? 'success' : 'info'}>
                {reviewQuote.status}
              </Badge>
              <p>
                {reviewQuote.snapshot?.travellers} reizigers · totale reissom{' '}
                <b>{reviewQuote.amount}</b>
              </p>
              {reviewQuote.snapshot?.personalMessage !== undefined && (
                <p className="preview-message">{reviewQuote.snapshot.personalMessage}</p>
              )}
              <h3>Inbegrepen onderdelen</h3>
              {travelProposals
                .find((travel) => travel.id === reviewQuote.snapshot?.proposalId)
                ?.parts.filter((part) => reviewQuote.snapshot?.parts[part.id])
                .map((part) => (
                  <p key={part.id}>
                    <Icon name="check" size={14} />{' '}
                    {part.alternatives?.[reviewQuote.snapshot?.alternatives[part.id] ?? -1]
                      ?.label ?? part.label}
                  </p>
                ))}
              <p className="field-hint">
                Door dit voorstel te kiezen accepteer je de offerte. Na bevestiging wordt je boeking
                aangemaakt.
              </p>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setReviewQuote(null)}>
                Sluiten
              </Button>
              <Button
                disabled={mutation.pending || reviewQuote.status === 'Geaccepteerd'}
                onClick={() => {
                  const number = reviewQuote.number
                  void mutation.run(
                    () => acceptQuoteAction(number),
                    () => setReviewQuote(null),
                  )
                }}
              >
                {reviewQuote.status === 'Geaccepteerd' ? 'Voorstel gekozen' : 'Voorstel kiezen'}
              </Button>
            </div>
          </section>
        </Dialog>
      )}
      {showDocuments && <Documents booking={myBooking} close={() => setShowDocuments(false)} />}
      {showPayment && (
        <Dialog
          className="overlay"
          titleId="dialog-title-4553"
          onClose={() => setShowPayment(false)}
        >
          <section className="modal">
            <div className="modal-head">
              <h2 id="dialog-title-4553">Betaling afronden</h2>
              <button aria-label="Sluiten" className="close" onClick={() => setShowPayment(false)}>
                ×
              </button>
            </div>
            <div className="form-content">
              <ErrorNotice message={mutation.error} />
              <p>
                Online betalen is nog niet beschikbaar. Neem voor de betaling van {myBooking.amount}{' '}
                voor {myBooking.trip} contact op met Voyage Vista.
              </p>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowPayment(false)}>
                Annuleren
              </Button>
              <Button disabled>Betaalprovider nog niet gekoppeld</Button>
            </div>
          </section>
        </Dialog>
      )}
    </div>
  )
}

function VoyageVistaApp({ trips }: { trips: PublicTravel[] }) {
  const { bookings, initialCustomerQuestions, quotes, travelWishes, travelProposals, user } =
    useVoyageData()
  const router = useRouter()
  const [questionTarget, setQuestionTarget] = useState<string>()
  const [newQuoteRequest, setNewQuoteRequest] = useState(false)
  const [utility, setUtility] = useState<'help' | 'notifications' | null>(null)
  const [roleMenu, setRoleMenu] = useState(false)
  const [staffMenuOpen, setStaffMenuOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [staffView, setStaffView] = useState<'portal' | 'home'>('portal')
  const staffViewChanged = useRef(false)
  const changeStaffView = (view: 'portal' | 'home') => {
    if (view === staffView) return
    staffViewChanged.current = true
    setStaffView(view)
  }
  useEffect(() => {
    if (!staffViewChanged.current) return
    document
      .querySelector<HTMLButtonElement>(
        `[data-staff-view="${staffView}"] button[aria-pressed="true"]`,
      )
      ?.focus()
    staffViewChanged.current = false
  }, [staffView])
  const [bookingItems] = useBackendState(bookings)
  const [questionItems] = useBackendState(initialCustomerQuestions)
  const [quoteItems] = useBackendState(quotes)
  const searchResults = globalQuery.trim()
    ? [
        ...nav
          .filter((item) => item.label.toLowerCase().includes(globalQuery.toLowerCase()))
          .map((item) => ({
            title: item.label,
            detail: 'Scherm openen',
            page: item.id,
            questionId: undefined as string | undefined,
            booking: null as Booking | null,
          })),
        ...bookingItems
          .filter((item) =>
            `${item.id} ${item.customer} ${item.trip}`
              .toLowerCase()
              .includes(globalQuery.toLowerCase()),
          )
          .map((item) => ({
            title: item.trip,
            detail: `${item.customer} · ${item.id}`,
            page: 'bookings',
            questionId: undefined,
            booking: item,
          })),
        ...questionItems
          .filter((item) =>
            `${item.subject} ${item.message}`.toLowerCase().includes(globalQuery.toLowerCase()),
          )
          .map((item) => ({
            title: item.subject,
            detail: `Klantvraag · ${item.status}`,
            page: 'customers',
            questionId: item.id,
            booking: null,
          })),
      ].slice(0, 8)
    : []
  const [page, setPage] = useState('dashboard')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedTravelForQuote, setSelectedTravelForQuote] = useState<TravelSelection | null>(null)

  const openBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setPage('bookings')
  }

  const navigate = (destination: string) => {
    setSelectedBooking(null)
    setGlobalQuery('')
    setPage(destination)
  }

  const selectTravelForQuote = (selection: TravelSelection) => {
    setSelectedTravelForQuote(selection)
    setPage('quotes')
  }

  const searchTripsForCustomer = (email: string, question?: CustomerQuestion) => {
    const wish = travelWishes[email]
    const travel = travelProposals.find(
      (item) =>
        item.id === question?.travelId ||
        (item.destination === question?.destination && item.dates === question?.period),
    )
    const requestedCount = Number(question?.travellers.match(/^\d+/)?.[0])
    tripsSessionState = {
      draft: {
        ...defaultSearch,
        travellers: !travellerError(requestedCount) ? requestedCount : (wish?.travellers ?? 2),
        destination:
          travel?.country ??
          (question?.destination &&
          !['nog te bepalen', 'onbekend', '—'].includes(question.destination.trim().toLowerCase())
            ? question.destination.trim()
            : ''),
        departure: question?.startDate ?? travel?.startDate ?? '',
        returnDate: question?.endDate ?? travel?.endDate ?? '',
      },
      requestBudget:
        question?.budget && /\d/.test(question.budget) ? question.budget : wish?.budget,
      selectedCustomerEmail: email,
      showOverBudget: false,
      maxPrice: '',
      viewMode: 'current',
      minRating: '',
      sort: 'recommended',
      compareIds: [],
    }
    setPage('trips')
  }

  if (user.role === 'customer') return <CustomerPortal trips={trips} />

  const viewSwitch = <StaffViewSwitch view={staffView} onViewChange={changeStaffView} />

  return (
    <>
      {staffView === 'home' && (
        <PublicHome
          trips={trips}
          navigation={
            <>
              {viewSwitch}
              <LogoutButton className="button button-secondary w-auto!" />
            </>
          }
        />
      )}
      <div
        className={staffView === 'home' ? 'app-shell hidden!' : 'app-shell'}
        hidden={staffView === 'home'}
      >
        <PublicHeader>
          {viewSwitch}
          <LogoutButton className="button button-secondary w-auto!" />
        </PublicHeader>
        <div className="mx-auto! flex! w-full! max-w-[1280px]! flex-col! lg:flex-row!">
          <aside
            className="relative! flex! w-full! shrink-0! flex-col! gap-6! border-b! border-[var(--vv-border)]! bg-white! p-4! sm:p-6! lg:sticky! lg:top-0! lg:h-dvh! lg:w-60! lg:self-start! lg:border-r! lg:border-b-0! lg:px-4! lg:py-8!"
            aria-label="Werkruimte"
          >
            <div className="flex! items-center! justify-between! gap-4!">
              <p className="m-0! text-sm! font-bold! tracking-[0.15em]! text-[var(--vv-muted)]!">
                WERKRUIMTE
              </p>
              <button
                type="button"
                className="button button-secondary lg:hidden!"
                id="staff-menu-toggle"
                aria-expanded={staffMenuOpen}
                aria-controls="staff-navigation"
                onClick={() => setStaffMenuOpen(!staffMenuOpen)}
              >
                <Icon name="menu" /> Menu
              </button>
            </div>
            <nav
              id="staff-navigation"
              aria-label="Medewerkersnavigatie"
              className={`${staffMenuOpen ? 'grid!' : 'hidden!'} gap-2! lg:grid!`}
            >
              {nav.map((item) => (
                <button
                  key={item.id}
                  className={`relative! flex! min-h-11! w-full! items-center! gap-3! rounded-lg! px-3! py-3! text-left! text-sm! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-primary)]! ${page === item.id ? 'bg-[var(--vv-primary)]! font-bold! text-white!' : 'bg-transparent! text-[var(--vv-primary)]! hover:bg-[var(--vv-subtle)]!'}`}
                  aria-current={page === item.id ? 'page' : undefined}
                  onClick={() => {
                    navigate(item.id)
                    setStaffMenuOpen(false)
                    if (staffMenuOpen && window.innerWidth < 1024) {
                      requestAnimationFrame(() =>
                        document.getElementById('staff-menu-toggle')?.focus(),
                      )
                    }
                  }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.id === 'customers' && (
                    <i className="h-6! min-w-6! bg-[var(--vv-subtle)]! px-2! text-sm! text-[var(--vv-primary)]!">
                      {questionItems.filter((question) => question.status !== 'Afgesloten').length}
                    </i>
                  )}
                  {item.id === 'quotes' && (
                    <i className="h-6! min-w-6! bg-[var(--vv-subtle)]! px-2! text-sm! text-[var(--vv-primary)]!">
                      {quoteItems.filter((quote) => quote.status === 'Concept').length}
                    </i>
                  )}
                  {'alert' in item && <i className="alert-dot" />}
                </button>
              ))}
            </nav>
            <div
              className={`relative! ${staffMenuOpen ? 'flex!' : 'hidden!'} flex-col! gap-4! lg:mt-auto! lg:flex!`}
            >
              <button
                className="button button-secondary justify-start!"
                onClick={() => setUtility('help')}
              >
                <Icon name="shield" /> Open kennisbank
              </button>
              <button
                className="flex! min-h-11! w-full! items-center! gap-3! rounded-lg! border! border-[var(--vv-border)]! bg-white! p-3! text-left! text-[var(--vv-primary)]! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-primary)]!"
                onClick={() => setRoleMenu(!roleMenu)}
                aria-expanded={roleMenu}
                aria-controls="staff-account-menu"
                aria-label={`Account van ${user.name}`}
              >
                <span className="grid! h-11! w-11! shrink-0! place-items-center! rounded-full! bg-[var(--vv-subtle)]! text-sm! font-bold!">
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="min-w-0! flex-1!">
                  <b className="block! truncate! text-sm!">{user.name}</b>
                  <small className="mt-1! block! text-sm! text-[var(--vv-muted)]!">
                    Medewerker
                  </small>
                </div>
                <Icon name="more" size={18} />
              </button>
              {roleMenu && (
                <div
                  id="staff-account-menu"
                  className="absolute! inset-x-0! top-full! z-30! mt-2! rounded-xl! border! border-[var(--vv-border)]! bg-white! p-4! shadow-lg! lg:top-auto! lg:bottom-20! lg:mt-0!"
                >
                  <p className="mb-3! text-sm! text-[var(--vv-primary)]!">
                    Medewerker · {user.name}
                  </p>
                  <LogoutButton className="button button-secondary w-full!" />
                </div>
              )}
            </div>
          </aside>
          <div className="workspace min-w-0! flex-1! w-full! m-0!">
            <header className="relative! top-0! z-20! h-auto! min-h-0! flex-wrap! gap-4! px-4! py-4! sm:px-6! lg:px-8!">
              <div className="breadcrumbs">
                <span>Voyage Vista</span>
                <Icon name="chevron" size={14} />
                <b>{nav.find((n) => n.id === page)?.label}</b>
              </div>
              <div className="header-actions min-w-0! w-full! items-end! flex-wrap! sm:w-auto!">
                <div className="min-w-0! flex-1!">
                  <label
                    htmlFor="workspace-search"
                    className="mb-2! block! text-sm! font-bold! text-[var(--vv-primary)]!"
                  >
                    Zoek in Voyage Vista
                  </label>
                  <div className="global-search">
                    <Icon name="search" />
                    <input
                      id="workspace-search"
                      aria-label="Zoek in Voyage Vista"
                      value={globalQuery}
                      onChange={(event) => setGlobalQuery(event.target.value)}
                      placeholder="Zoek reizen, klanten, boekingen…"
                    />
                    {globalQuery && (
                      <div className="global-results">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setGlobalQuery('')
                              setQuestionTarget(result.questionId)
                              result.booking ? openBooking(result.booking) : navigate(result.page)
                            }}
                          >
                            <b>{result.title}</b>
                            <small>{result.detail}</small>
                          </button>
                        ))}
                        {!searchResults.length && <p>Geen resultaten gevonden.</p>}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  aria-label="Meldingen openen"
                  className="notification"
                  onClick={() => setUtility('notifications')}
                >
                  <Icon name="bell" />
                  <i />
                </button>
              </div>
            </header>
            <main className="m-0! w-full! max-w-none! px-4! py-8! sm:px-6! lg:px-8!">
              {page === 'dashboard' && (
                <Dashboard
                  goTo={(destination) => {
                    if (destination === 'quotes') setNewQuoteRequest(true)
                    navigate(destination)
                  }}
                  openBooking={openBooking}
                />
              )}
              {page === 'bookings' && (
                <BookingList selected={selectedBooking} setSelected={setSelectedBooking} />
              )}
              {page === 'quotes' && (
                <Quotes
                  openNew={newQuoteRequest}
                  clearOpenNew={() => setNewQuoteRequest(false)}
                  initialSelection={selectedTravelForQuote}
                  clearInitialSelection={() => setSelectedTravelForQuote(null)}
                />
              )}
              {page === 'trips' && <Trips selectForQuote={selectTravelForQuote} />}
              {page === 'customers' && (
                <Customers
                  initialQuestionId={questionTarget}
                  searchTripsForCustomer={searchTripsForCustomer}
                  openBooking={openBooking}
                />
              )}
            </main>
          </div>
        </div>
        {utility && (
          <Dialog className="overlay" titleId="dialog-title-4914" onClose={() => setUtility(null)}>
            <section
              className="modal"

              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  <p className="eyebrow">WERKRUIMTE</p>
                  <h2 id="dialog-title-4914">
                    {utility === 'help' ? 'Waar kunnen we je mee helpen?' : 'Meldingen'}
                  </h2>
                </div>
                <button className="close" aria-label="Sluiten" onClick={() => setUtility(null)}>
                  ×
                </button>
              </div>
              <div className="form-content">
                {utility === 'help' ? (
                  [
                    [
                      'Een reisvoorstel maken',
                      'Open Reizen, filter op bestemming en reizigers, en kies een reis. Via ‘Offerte maken’ neem je de selectie over naar een offerte. Controleer de onderdelen en sla het voorstel op.',
                    ],
                    [
                      'Klantvragen behandelen',
                      'Open Klantvragen, selecteer een vraag en stuur een antwoord. Je kunt ook interne notities maken of de vraag doorsturen naar een specialist.',
                    ],
                    [
                      'Boekingen en documenten',
                      'Open een boeking om de status of reisgegevens te wijzigen. Reisdocumenten verschijnen zodra ze beschikbaar zijn.',
                    ],
                    [
                      'App-accounts',
                      'Log in met je eigen account. Medewerkers en klanten zien de omgeving die bij hun account hoort. Neem voor accountbeheer contact op met je beheerder.',
                    ],
                    [
                      'Over deze omgeving',
                      'Je wijzigingen worden na bevestiging opgeslagen. Neem voor accountbeheer, reisdocumenten of betaalvragen contact op met je beheerder.',
                    ],
                  ].map(([title, text]) => (
                    <details className="help-topic" key={title}>
                      <summary>{title}</summary>
                      <p>{text}</p>
                    </details>
                  ))
                ) : (
                  <>
                    {questionItems
                      .filter((question) => question.unread)
                      .map((question) => (
                        <button
                          className="notification-row"
                          key={question.id}
                          onClick={() => {
                            setUtility(null)
                            setQuestionTarget(question.id)
                            navigate('customers')
                          }}
                        >
                          <Icon name="users" />
                          <div>
                            <b>{question.subject}</b>
                            <small>Nieuwe klantvraag · {question.received}</small>
                          </div>
                          <Icon name="chevron" />
                        </button>
                      ))}
                    {!questionItems.some((question) => question.unread) && (
                      <p>Je bent helemaal bij. Er zijn geen nieuwe meldingen.</p>
                    )}
                  </>
                )}
              </div>
            </section>
          </Dialog>
        )}
      </div>
    </>
  )
}

export default function App({ data, trips }: { data: VoyageVistaData; trips: PublicTravel[] }) {
  useEffect(
    () => () => {
      quoteDraftSession = null
      tripsSessionState = null
    },
    [data.user.email],
  )
  return (
    <VoyageDataContext.Provider value={data}>
      <VoyageVistaApp trips={trips} />
    </VoyageDataContext.Provider>
  )
}
