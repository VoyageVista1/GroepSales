import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'
import { invalidateVoyageCatalog } from '../lib/voyage-cache'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [invalidateVoyageCatalog],
    afterDelete: [invalidateVoyageCatalog],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    createFolderField({ relationTo: 'folders' }),
    createTagField({ relationTo: 'tags' }),
  ],
  upload: true,
}
