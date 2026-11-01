import type { CollectionConfig } from 'payload'
import { invalidateVoyageCatalog } from '../lib/voyage-cache'
import { catalogAccess, legacyId, money, protectReferences, relation } from '../lib/voyage-schema'

export const DestinationFees: CollectionConfig = {
  slug: 'destination-fees',
  labels: { singular: 'Lokale heffing', plural: 'Lokale heffingen' },
  admin: {
    group: 'Reisaanbod',
    useAsTitle: 'label',
    defaultColumns: ['label', 'country', 'rate', 'unit', 'payment'],
  },
  access: { ...catalogAccess },
  versions: false,
  hooks: {
    afterChange: [invalidateVoyageCatalog],
    afterDelete: [invalidateVoyageCatalog],
    beforeDelete: [
      protectReferences([
        { collection: 'quotes', field: 'localFees.fee' },
        { collection: 'bookings', field: 'localFees.fee' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    { name: 'label', label: 'Naam', type: 'text', required: true },
    { name: 'country', label: 'Land', type: 'text', required: true, index: true },
    relation('destination', 'Specifieke bestemming (optioneel)', 'destinations', false),
    { name: 'description', label: 'Toelichting', type: 'textarea' },
    money('rate', 'Tarief (leeg = nog te bevestigen)'),
    {
      name: 'unit',
      label: 'Eenheid',
      type: 'select',
      options: ['perPerson', 'perPersonNight'],
      required: true,
    },
    {
      name: 'payment',
      label: 'Betaling',
      type: 'select',
      options: ['included', 'local'],
      defaultValue: 'local',
      required: true,
    },
  ],
}
