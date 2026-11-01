import { loadPublicTrips } from '@/lib/public-catalog'
import PublicHome from './PublicHome'

export const metadata = {
  title: 'Voyage Vista | Ontdek jouw volgende reis',
  description:
    'Ontdek het reisaanbod van Voyage Vista. Bekijk bestemmingen, reisdetails en vanafprijzen, ook zonder account.',
}

export default async function HomePage() {
  const trips = await loadPublicTrips()
  return <PublicHome trips={trips} />
}
