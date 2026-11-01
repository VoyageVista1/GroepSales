'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { activateCustomerProfileAction } from '@/actions/voyage'
import LogoutButton from './LogoutButton'
import PublicHome from './PublicHome'
import type { PublicTravel } from '@/types/public-travel'

export default function AccountPending({ trips, name }: { trips: PublicTravel[]; name: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  return (
    <PublicHome
      trips={trips}
      navigation={
        <>
          <a
            href="#reisaanbod"
            className="inline-flex! min-h-11! items-center! rounded-lg! px-3! py-2! text-white! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-mint)]!"
          >
            Onze reizen
          </a>
          <span className="text-sm! text-white!">Welkom, {name.split(' ')[0]}</span>
          <LogoutButton className="button button-secondary w-auto!" />
        </>
      }
      notice={
        <aside
          role="status"
          className="mx-auto! max-w-[1216px]! rounded-xl! border! border-[var(--vv-info-text)]! bg-[var(--vv-info-bg)]! p-4! text-[var(--vv-info-text)]!"
        >
          <p className="m-0! text-base! leading-relaxed!">
            Je bent ingelogd en kunt alle reizen bekijken. Activeer je klantomgeving om direct te
            boeken, favorieten te bewaren en reiswensen in te dienen. Je hebt hiervoor geen
            medewerker nodig.
          </p>
          <button
            type="button"
            className="mt-3! min-h-11! rounded-lg! border! border-[var(--vv-primary)]! bg-transparent! px-4! text-sm! font-bold! text-[var(--vv-primary)]!"
            disabled={pending}
            onClick={async () => {
              if (inFlight.current) return
              inFlight.current = true
              setPending(true)
              setError('')
              try {
                const result = await activateCustomerProfileAction()
                if (result.ok) router.refresh()
                else setError(result.message)
              } catch {
                setError('Activeren is niet gelukt. Probeer opnieuw.')
              } finally {
                inFlight.current = false
                setPending(false)
              }
            }}
          >
            {pending ? 'Klantomgeving activeren…' : 'Activeer mijn klantomgeving'}
          </button>
          {error && (
            <p
              role="alert"
              className="mt-3! rounded-lg! bg-[var(--vv-error-bg)]! p-3! text-[var(--vv-error-text)]!"
            >
              {error}
            </p>
          )}
        </aside>
      }
    />
  )
}
