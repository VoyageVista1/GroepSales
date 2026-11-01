import type { CollectionConfig } from 'payload'
import {
  legacyId,
  cmsFieldOnly,
  privateAccess,
  protectReferences,
  staffOrLinkedCustomer,
  travelPreferenceFields,
  validateRecord,
} from '../lib/voyage-schema'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Klant', plural: 'Klanten' },
  admin: {
    group: 'Relaties',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'customerType'],
  },
  access: { ...privateAccess, read: staffOrLinkedCustomer },
  versions: false,
  hooks: {
    beforeValidate: [validateRecord],
    beforeDelete: [
      protectReferences([
        { collection: 'quotes', field: 'customer' },
        { collection: 'bookings', field: 'customer' },
        { collection: 'customer-questions', field: 'customer' },
        { collection: 'favorites', field: 'customer' },
        { collection: 'travel-documents', field: 'customer' },
      ]),
    ],
  },
  fields: [
    legacyId(),
    { name: 'name', label: 'Naam', type: 'text', required: true, index: true },
    {
      name: 'email',
      label: 'E-mailadres',
      type: 'email',
      required: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        ],
      },
    },
    { name: 'phone', label: 'Telefoonnummer', type: 'text' },
    {
      name: 'customerType',
      label: 'Klanttype',
      type: 'select',
      options: ['private', 'business'],
      defaultValue: 'private',
      required: true,
    },
    { name: 'companyName', label: 'Bedrijfsnaam', type: 'text' },
    { name: 'vatNumber', label: 'BTW-nummer', type: 'text' },
    { name: 'wishes', label: 'Reiswensen', type: 'group', fields: travelPreferenceFields() },
    {
      name: 'internalNotes',
      label: 'Interne klantnotities',
      type: 'textarea',
      access: { read: cmsFieldOnly },
    },
    { name: 'archived', label: 'Gearchiveerd', type: 'checkbox', defaultValue: false, index: true },
  ],
}
