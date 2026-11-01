import 'server-only'

import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './payload'
import { VOYAGE_CATALOG_TAG } from './voyage-cache'
import type { PublicTravel } from '@/types/public-travel'

// No request user, cookies or private collections may enter this shared cache.
export const loadPublicTrips = unstable_cache(
  async (): Promise<PublicTravel[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'trips',
      draft: false,
      overrideAccess: false,
      where: { _status: { equals: 'published' } },
      sort: 'startDate',
      limit: 1000,
      depth: 1,
      select: {
        title: true,
        destination: true,
        periodLabel: true,
        startDate: true,
        endDate: true,
        duration: true,
        price: true,
        maxTravellers: true,
        available: true,
        description: true,
        image: true,
        facilities: true,
      },
    })
    return result.docs.map((trip) => {
      const destination =
        trip.destination && typeof trip.destination === 'object' ? trip.destination : null
      const image = trip.image && typeof trip.image === 'object' ? trip.image : null
      return {
        id: trip.id,
        title: trip.title,
        destination: destination?.name ?? 'Bestemming volgt',
        country: destination?.country ?? '',
        period: trip.periodLabel ?? '',
        startDate: trip.startDate,
        endDate: trip.endDate,
        nights: trip.duration,
        price: Number.isFinite(trip.price) ? trip.price : null,
        maxTravellers: trip.maxTravellers,
        available: trip.available ?? false,
        description: trip.description,
        image: image?.url ?? null,
        imageAlt: image?.alt ?? trip.title,
        facilities: (trip.facilities ?? []).map((item) => item.label),
      }
    })
  },
  ['voyage-public-home-v1'],
  { tags: [VOYAGE_CATALOG_TAG] },
)
