import type { CollectionConfig } from 'payload'
import { invalidateVoyageCatalog } from '../lib/voyage-cache'
import {
  catalogAccess,
  cmsOnly,
  integer,
  legacyId,
  money,
  protectReferences,
  relation,
  validateRecord,
} from '../lib/voyage-schema'

export const Trips: CollectionConfig = {
  slug: 'trips',
  labels: { singular: 'Reis', plural: 'Reizen' },
  admin: {
    group: 'Reisaanbod',
    useAsTitle: 'title',
    defaultColumns: ['title', 'destination', 'price', 'available', '_status'],
  },
  access: {
    ...catalogAccess,
    read: (args) => (cmsOnly(args) ? true : { _status: { equals: 'published' } }),
  },
  versions: { drafts: true },
  hooks: {
    beforeValidate: [validateRecord],
    afterChange: [invalidateVoyageCatalog],
    afterDelete: [invalidateVoyageCatalog],
    beforeDelete: [
      protectReferences([
        { collection: 'customers', field: 'wishes.preferredTrip' },
        { collection: 'quotes', field: 'trip' },
        { collection: 'bookings', field: 'trip' },
        { collection: 'customer-questions', field: 'trip' },
        { collection: 'favorites', field: 'trip' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    { name: 'title', label: 'Titel', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
    relation('destination', 'Bestemming', 'destinations'),
    { name: 'periodLabel', label: 'Periode zoals weergegeven', type: 'text' },
    { name: 'startDate', label: 'Vertrekdatum', type: 'date', required: true, index: true },
    { name: 'endDate', label: 'Terugkomstdatum', type: 'date', required: true },
    { ...integer('duration', 'Aantal nachten', 0), required: true },
    money('price', 'Getoonde vanafprijs per persoon', true),
    { name: 'rating', label: 'Beoordeling', type: 'number', min: 0, max: 5 },
    { ...integer('maxTravellers', 'Maximaal aantal reizigers', 1, 20), required: true },
    integer('remainingSpots', 'Resterende plaatsen', 0, 20),
    { name: 'available', label: 'Beschikbaar', type: 'checkbox', defaultValue: true, index: true },
    { name: 'availabilityLabel', label: 'Beschikbaarheidstekst', type: 'text' },
    { name: 'description', label: 'Beschrijving', type: 'textarea', required: true },
    { name: 'image', label: 'Reisfoto', type: 'upload', relationTo: 'media' },
    {
      name: 'facilities',
      label: 'Faciliteiten',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'parts',
      label: 'Reisonderdelen',
      type: 'array',
      fields: [
        { name: 'key', label: 'Onderdeelsleutel', type: 'text', required: true },
        { name: 'label', label: 'Omschrijving', type: 'text', required: true },
        money('price', 'Prijs', true),
        { name: 'perPerson', label: 'Per persoon', type: 'checkbox', defaultValue: true },
        { name: 'required', label: 'Verplicht onderdeel', type: 'checkbox', defaultValue: false },
        {
          name: 'defaultSelected',
          label: 'Standaard geselecteerd',
          type: 'checkbox',
          defaultValue: false,
        },
        { name: 'available', label: 'Beschikbaar', type: 'checkbox', defaultValue: true },
        {
          name: 'alternatives',
          label: 'Alternatieven (volgorde behouden)',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            money('price', 'Prijs', true),
            { name: 'available', label: 'Beschikbaar', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ],
}
