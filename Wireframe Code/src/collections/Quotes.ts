import type { CollectionConfig } from 'payload'
import {
  appUserField,
  integer,
  legacyId,
  legacyLabels,
  matchRelated,
  priceLineFields,
  privateAccess,
  protectReferences,
  protectCustomerQuoteStatus,
  relation,
  staffManaged,
  staffOrCustomer,
  validateRecord,
  workflow,
} from '../lib/voyage-schema'

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: { singular: 'Offerte', plural: 'Offertes' },
  admin: {
    group: 'Verkoop',
    useAsTitle: 'number',
    defaultColumns: ['number', 'customer', 'trip', 'totalAmount', 'status'],
  },
  access: { ...privateAccess, read: staffOrCustomer(), update: staffOrCustomer() },
  // A sales concept is a business status, not an editorial publication draft.
  versions: false,
  hooks: {
    beforeValidate: [validateRecord],
    beforeChange: [
      protectCustomerQuoteStatus,
      matchRelated('question', 'customer-questions', ['customer']),
    ],
    beforeDelete: [
      protectReferences([
        { collection: 'bookings', field: 'quote' },
        { collection: 'travel-documents', field: 'quote' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    {
      name: 'number',
      label: 'Offertenummer',
      type: 'text',
      required: true,
      unique: true,
      access: staffManaged,
    },
    relation('customer', 'Klant', 'customers'),
    relation('trip', 'Reis', 'trips', false),
    relation('question', 'Aanleiding / klantvraag', 'customer-questions', false),
    workflow(
      ['Concept', 'Verstuurd', 'Geaccepteerd', 'Afgewezen', 'Verlopen', 'Geannuleerd'],
      'Concept',
      { create: staffManaged.create, update: appUserField },
    ),
    {
      name: 'customerType',
      label: 'Klanttype bij offerte',
      type: 'select',
      options: ['private', 'business'],
    },
    integer('travellers', 'Aantal reizigers', 1, 20),
    { name: 'budgetLabel', label: 'Opgegeven budget', type: 'text' },
    { name: 'startDate', label: 'Vertrekdatum', type: 'date' },
    { name: 'endDate', label: 'Terugkomstdatum', type: 'date' },
    { name: 'personalMessage', label: 'Begeleidende tekst', type: 'textarea' },
    { name: 'validUntil', label: 'Geldig tot', type: 'date' },
    { name: 'sentAt', label: 'Daadwerkelijk verzonden op', type: 'date', access: staffManaged },
    { name: 'acceptedAt', label: 'Geaccepteerd op', type: 'date', access: staffManaged },
    ...priceLineFields(),
    {
      name: 'legacySnapshot',
      label: 'Oorspronkelijke offerteconfiguratie',
      type: 'json',
      admin: {
        description:
          'Bewaar de oorspronkelijke snapshot ongewijzigd, inclusief onderdelen, alternatiefindexen, extras en lokale tarieven. Gebruik daarnaast de gestructureerde prijsregels.',
      },
      access: staffManaged,
    },
    legacyLabels(),
  ],
}
