import type { GlobalConfig } from 'payload'
import { cmsOnly, integer, money } from '../lib/voyage-schema'

export const TravelSettings: GlobalConfig = {
  slug: 'travel-settings',
  label: 'Reisinstellingen',
  admin: { group: 'Instellingen' },
  access: { read: cmsOnly, update: cmsOnly },
  fields: [
    { name: 'companyName', label: 'Bedrijfsnaam', type: 'text', defaultValue: 'Voyage Vista' },
    { name: 'contactEmail', label: 'Contact e-mail', type: 'email' },
    { name: 'contactPhone', label: 'Contacttelefoon', type: 'text' },
    {
      name: 'currency',
      label: 'Valuta',
      type: 'select',
      options: ['EUR'],
      defaultValue: 'EUR',
      required: true,
    },
    { ...money('serviceCostsPerPerson', 'Servicekosten per persoon', true), defaultValue: 39 },
    {
      name: 'defaultVatRate',
      label: 'Standaard BTW-percentage',
      type: 'number',
      defaultValue: 21,
      min: 0,
      max: 30,
      admin: { step: 0.1 },
    },
    { ...integer('quoteValidityDays', 'Geldigheidsduur offerte (dagen)', 1), defaultValue: 14 },
    { name: 'quoteMessage', label: 'Standaard begeleidende offertetekst', type: 'textarea' },
  ],
}
