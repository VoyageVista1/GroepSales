import type { Access, CollectionConfig, FieldAccess } from 'payload'
import { ensureCustomerProfile } from '../lib/customer-profile'

const isAdmin = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'admins'
const isSelfOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { id: { equals: req.user.id } }
}
const adminField: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'App-account', plural: 'App-accounts' },
  auth: true,
  admin: {
    group: 'Accounts',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'customer'],
  },
  access: {
    create: () => true,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [async ({ doc, req }) => ensureCustomerProfile(doc, req)],
    afterLogin: [async ({ user, req }) => ensureCustomerProfile(user, req)],
    beforeValidate: [
      ({ data, operation, req }) =>
        operation === 'create' && req.user?.collection !== 'admins'
          ? { ...data, role: 'customer', customer: null }
          : data,
    ],
  },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      options: ['customer', 'staff'],
      defaultValue: 'customer',
      required: true,
      access: { create: adminField, update: adminField },
    },
    {
      name: 'customer',
      label: 'Gekoppeld klantprofiel',
      type: 'relationship',
      relationTo: 'customers',
      unique: true,
      index: true,
      access: { create: adminField, update: adminField },
      admin: {
        description:
          'Nieuwe accounts krijgen automatisch een eigen profiel. Koppel bestaande dossiers uitsluitend na controle van eigenaarschap; een e-mailadres alleen is geen bewijs.',
      },
    },
  ],
}
