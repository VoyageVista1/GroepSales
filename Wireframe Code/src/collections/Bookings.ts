import type { CollectionConfig } from 'payload'
import {
  assignLinkedCustomer,
  cmsFieldOnly,
  integer,
  legacyId,
  legacyLabels,
  matchRelated,
  priceLineFields,
  privateAccess,
  protectCustomerBookingCreate,
  protectReferences,
  relation,
  staffManaged,
  staffOrAppUser,
  staffOrCustomer,
  validateRecord,
  workflow,
} from '../lib/voyage-schema'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Boeking', plural: 'Boekingen' },
  admin: {
    group: 'Verkoop',
    useAsTitle: 'number',
    defaultColumns: ['number', 'customer', 'trip', 'totalAmount', 'status'],
  },
  access: { ...privateAccess, create: staffOrAppUser, read: staffOrCustomer() },
  versions: false,
  hooks: {
    beforeValidate: [assignLinkedCustomer(), validateRecord],
    beforeChange: [
      protectCustomerBookingCreate,
      matchRelated('quote', 'quotes', ['customer', 'trip']),
    ],
    beforeDelete: [
      protectReferences([
        { collection: 'customer-questions', field: 'booking' },
        { collection: 'travel-documents', field: 'booking' },
        { collection: 'payments', field: 'booking' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    {
      name: 'number',
      label: 'Boekingsnummer',
      type: 'text',
      required: true,
      unique: true,
    },
    relation('customer', 'Klant', 'customers'),
    // Optional for import: a legacy display title is not necessarily a catalog title.
    relation('trip', 'Reis', 'trips', false),
    relation('quote', 'Geaccepteerde offerte', 'quotes', false),
    workflow(['Optie', 'Wacht op betaling', 'Bevestigd', 'Geannuleerd'], 'Optie'),
    integer('travellers', 'Aantal reizigers', 1, 20),
    { name: 'startDate', label: 'Vertrekdatum', type: 'date' },
    { name: 'endDate', label: 'Terugkomstdatum', type: 'date' },
    { name: 'periodLabel', label: 'Oorspronkelijke reisperiode', type: 'text' },
    ...priceLineFields(),
    {
      name: 'internalNotes',
      label: 'Interne notities',
      type: 'textarea',
      access: { read: cmsFieldOnly },
    },
    legacyLabels(),
  ],
}
