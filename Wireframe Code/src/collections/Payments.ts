import type { CollectionConfig } from 'payload'
import {
  legacyId,
  money,
  privateAccess,
  relation,
  staffManaged,
  staffOrCustomer,
  workflow,
} from '../lib/voyage-schema'

export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: { singular: 'Betaling', plural: 'Betalingen' },
  admin: {
    group: 'Verkoop',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'booking', 'amount', 'status', 'isTest'],
  },
  access: { ...privateAccess, read: staffOrCustomer('booking.customer'), delete: () => false },
  versions: false,
  fields: [
    legacyId(),
    {
      name: 'reference',
      label: 'Betalingsreferentie',
      type: 'text',
      required: true,
      unique: true,
      access: staffManaged,
    },
    relation('booking', 'Boeking', 'bookings'),
    money('amount', 'Bedrag', true),
    {
      name: 'currency',
      label: 'Valuta',
      type: 'select',
      options: ['EUR'],
      defaultValue: 'EUR',
      required: true,
    },
    workflow(['pending', 'paid', 'failed', 'cancelled', 'refunded'], 'pending'),
    { name: 'method', label: 'Betaalmethode', type: 'text' },
    { name: 'provider', label: 'Betaalprovider', type: 'text', access: staffManaged },
    {
      name: 'providerPaymentId',
      label: 'Providertransactie-ID',
      type: 'text',
      unique: true,
      access: staffManaged,
    },
    {
      name: 'isTest',
      label: 'Testbetaling',
      type: 'checkbox',
      defaultValue: true,
      access: staffManaged,
    },
    { name: 'paidAt', label: 'Daadwerkelijk betaald op', type: 'date', access: staffManaged },
    { name: 'internalNotes', label: 'Interne toelichting', type: 'textarea' },
  ],
}
