import type { CollectionConfig } from 'payload'
import {
  legacyId,
  assignLinkedCustomer,
  privateAccess,
  relation,
  staffOrAppUser,
  staffOrCustomer,
} from '../lib/voyage-schema'

export const Favorites: CollectionConfig = {
  slug: 'favorites',
  labels: { singular: 'Favoriet', plural: 'Favorieten' },
  admin: { group: 'Relaties', defaultColumns: ['customer', 'trip', 'createdAt'] },
  access: {
    ...privateAccess,
    create: staffOrAppUser,
    read: staffOrCustomer(),
    delete: staffOrCustomer(),
  },
  versions: false,
  hooks: { beforeValidate: [assignLinkedCustomer()] },
  indexes: [{ fields: ['customer', 'trip'], unique: true }],
  fields: [
    legacyId(),
    relation('customer', 'Klant', 'customers'),
    relation('trip', 'Reis', 'trips'),
  ],
}
