import type { CollectionConfig } from 'payload'
import {
  legacyId,
  matchRelated,
  privateAccess,
  relation,
  staffManaged,
  staffOrCustomer,
} from '../lib/voyage-schema'

// Do not store tickets/vouchers in the template's publicly readable Media
// collection. A separate, access-controlled upload collection protects files too.
export const TravelDocuments: CollectionConfig = {
  slug: 'travel-documents',
  labels: { singular: 'Reisdocument', plural: 'Reisdocumenten' },
  admin: {
    group: 'Verkoop',
    useAsTitle: 'title',
    defaultColumns: ['title', 'customer', 'booking', 'documentType'],
  },
  access: { ...privateAccess, read: staffOrCustomer() },
  versions: false,
  upload: { mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'] },
  hooks: {
    beforeChange: [
      matchRelated('booking', 'bookings', ['customer']),
      matchRelated('quote', 'quotes', ['customer']),
    ],
  },
  fields: [
    legacyId(),
    { name: 'title', label: 'Titel', type: 'text', required: true },
    relation('customer', 'Klant', 'customers'),
    relation('booking', 'Boeking', 'bookings', false),
    relation('quote', 'Offerte', 'quotes', false),
    {
      name: 'documentType',
      label: 'Documentsoort',
      type: 'select',
      required: true,
      options: ['bookingConfirmation', 'travelSummary', 'quote', 'ticket', 'voucher', 'other'],
    },
    { name: 'issuedAt', label: 'Uitgegeven op', type: 'date', access: staffManaged },
    { name: 'internalNotes', label: 'Interne toelichting', type: 'textarea' },
  ],
}
