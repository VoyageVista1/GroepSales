import type { Trip } from '@/payload-types'

// Only the published catalog fields needed by anonymous visitors.
export type PublicTravel = {
  id: Trip['id']
  title: string
  destination: string
  country: string
  period: string
  startDate: string
  endDate: string
  nights: number
  price: number | null
  maxTravellers: number
  available: boolean
  description: string
  image: string | null
  imageAlt: string
  facilities: string[]
}
