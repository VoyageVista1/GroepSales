import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { loadVoyageVistaData } from '@/lib/voyage-data'
import { loadPublicTrips } from '@/lib/public-catalog'
import AccountPending from '../AccountPending'
import ErrorBoundary from '../ErrorBoundary'
import VoyageVista from '../VoyageVista'
import LogoutButton from '../LogoutButton'

export const metadata = {
  title: 'Mijn account | Voyage Vista',
  robots: { index: false, follow: false },
}

type PageSearchParams = Promise<{ auth?: string | string[] }>

async function VoyageVistaPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { auth } = await searchParams
  const user = await appAuth.currentUser()
  if (!user) redirect(auth === 'check' ? '/inloggen?auth=check' : '/inloggen')
  // The verification marker is only for a failed round trip. Remove it after
  // successful authentication so a later intentional logout shows a clean form.
  if (auth === 'check') redirect('/mijn-account')
  let data
  try {
    data = await loadVoyageVistaData(user)
  } catch (error) {
    if (!error || typeof error !== 'object' || !('status' in error) || error.status !== 403)
      throw error
    return (
      <main className="app-error-screen">
        <h1>Je account heeft nog geen toegang</h1>
        <p>Vraag je beheerder om de rol en klantkoppeling van je app-account te controleren.</p>
        <div className="flex flex-wrap gap-4">
          <a className="button button-primary" href="/">
            Reizen bekijken
          </a>
          <LogoutButton />
        </div>
      </main>
    )
  }
  const trips = await loadPublicTrips()
  if (!data || (user.role === 'customer' && data.customers.length === 0)) {
    return <AccountPending trips={trips} name={user.name} />
  }
  return (
    <ErrorBoundary>
      <VoyageVista data={data} trips={trips} />
    </ErrorBoundary>
  )
}

export default function HomePage({ searchParams }: { searchParams: PageSearchParams }) {
  return (
    <Suspense fallback={<main className="app-error-screen">Voyage Vista laden…</main>}>
      <VoyageVistaPage searchParams={searchParams} />
    </Suspense>
  )
}
