import type { CollectionConfig } from 'payload'
import { invalidateVoyageCatalog } from '../lib/voyage-cache'
import { catalogAccess, legacyId, protectReferences } from '../lib/voyage-schema'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  labels: { singular: 'Bestemming', plural: 'Bestemmingen' },
  admin: { group: 'Reisaanbod', useAsTitle: 'name', defaultColumns: ['name', 'country'] },
  access: { ...catalogAccess },
  versions: false,
  hooks: {
    afterChange: [invalidateVoyageCatalog],
    afterDelete: [invalidateVoyageCatalog],
    beforeDelete: [
      protectReferences([
        { collection: 'trips', field: 'destination' },
        { collection: 'destination-fees', field: 'destination' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    { name: 'name', label: 'Naam', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name' },
    { name: 'country', label: 'Land', type: 'text', required: true, index: true },
    { name: 'description', label: 'Beschrijving', type: 'textarea' },
    { name: 'image', label: 'Afbeelding', type: 'upload', relationTo: 'media' },
  ],
}
