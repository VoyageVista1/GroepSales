import type { CollectionConfig } from 'payload'
import { Customers } from './Customers'
import { Destinations } from './Destinations'
import { Trips } from './Trips'
import { Extras } from './Extras'
import { DestinationFees } from './DestinationFees'
import { Quotes } from './Quotes'
import { Bookings } from './Bookings'
import { CustomerQuestions } from './CustomerQuestions'
import { Messages } from './Messages'
import { Favorites } from './Favorites'
import { TravelDocuments } from './TravelDocuments'
import { Payments } from './Payments'

export const voyageCollections: CollectionConfig[] = [
  Customers,
  Destinations,
  Trips,
  Extras,
  DestinationFees,
  Quotes,
  Bookings,
  CustomerQuestions,
  Messages,
  Favorites,
  TravelDocuments,
  Payments,
]
