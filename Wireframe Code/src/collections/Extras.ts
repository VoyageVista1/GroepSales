import type { CollectionConfig } from 'payload'
import { invalidateVoyageCatalog } from '../lib/voyage-cache'
import { catalogAccess, legacyId, money, protectReferences } from '../lib/voyage-schema'

export const Extras: CollectionConfig = {
  slug: 'extras',
  labels: { singular: 'Extra', plural: 'Extra’s' },
  admin: {
    group: 'Reisaanbod',
    useAsTitle: 'label',
    defaultColumns: ['label', 'price', 'perPerson', 'available'],
  },
  access: { ...catalogAccess },
  versions: false,
  hooks: {
    afterChange: [invalidateVoyageCatalog],
    afterDelete: [invalidateVoyageCatalog],
    beforeDelete: [
      protectReferences([
        { collection: 'quotes', field: 'lineItems.extra' },
        { collection: 'bookings', field: 'lineItems.extra' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    { name: 'label', label: 'Naam', type: 'text', required: true },
    { name: 'description', label: 'Beschrijving', type: 'textarea' },
    money('price', 'Prijs', true),
    { name: 'perPerson', label: 'Per persoon', type: 'checkbox', defaultValue: true },
    { name: 'available', label: 'Beschikbaar', type: 'checkbox', defaultValue: true },
  ],
}
