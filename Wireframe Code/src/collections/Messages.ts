import type { CollectionConfig, Where } from 'payload'
import {
  legacyId,
  privateAccess,
  relation,
  staffManaged,
  isStaff,
  customerIdForUser,
} from '../lib/voyage-schema'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Bericht / notitie', plural: 'Berichten en notities' },
  admin: {
    group: 'Klantenservice',
    useAsTitle: 'body',
    defaultColumns: ['question', 'kind', 'authorName', 'deliveryStatus', 'createdAt'],
  },
  access: {
    ...privateAccess,
    read: (args) => {
      if (isStaff(args)) return true
      const customer = customerIdForUser(args.req.user)
      if (customer === undefined) return false
      const where: Where = {
        and: [
          { 'question.customer': { equals: customer } },
          { kind: { not_equals: 'internalNote' } },
        ],
      }
      return where
    },
  },
  versions: false,
  fields: [
    legacyId(),
    relation('question', 'Klantvraag', 'customer-questions'),
    {
      name: 'kind',
      label: 'Soort',
      type: 'select',
      options: ['customerMessage', 'staffReply', 'internalNote'],
      required: true,
      access: staffManaged,
    },
    { name: 'body', label: 'Bericht', type: 'textarea', required: true },
    { name: 'authorName', label: 'Naam afzender (indien bekend)', type: 'text' },
    {
      name: 'sentAt',
      label: 'Werkelijk verzonden op (indien bekend)',
      type: 'date',
      access: staffManaged,
    },
    {
      name: 'deliveryStatus',
      label: 'Afleverstatus',
      type: 'select',
      options: ['imported', 'draft', 'received', 'sent', 'failed'],
      defaultValue: 'draft',
      required: true,
      access: staffManaged,
      admin: {
        description:
          'Gebruik imported voor prototypeberichten; dit bewijst geen echte e-mail- of WhatsApp-verzending.',
      },
    },
  ],
}
