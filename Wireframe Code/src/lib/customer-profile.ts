import type { PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

// A deterministic, already-unique legacyId makes retries safe without ever
// claiming a historical dossier by email. These are trusted lifecycle writes,
// not a public profile update or a content/seed mutation.
export async function ensureCustomerProfile(user: User, req: PayloadRequest): Promise<User> {
  if (user.role !== 'customer' || user.customer) return user
  const key = `app-account:${user.id}`
  const options = { req, overrideAccess: true as const, depth: 0 }
  const find = () =>
    req.payload.find({
      collection: 'customers',
      where: { legacyId: { equals: key } },
      limit: 1,
      ...options,
    })
  let customer = (await find()).docs[0]
  if (!customer) {
    try {
      customer = await req.payload.create({
        collection: 'customers',
        data: { legacyId: key, name: user.name, email: user.email, customerType: 'private' },
        ...options,
      })
    } catch (error) {
      customer = (await find()).docs[0]
      if (!customer) throw error
    }
  }
  // Re-read before linking: a CMS editor may already have linked an existing
  // dossier. Respect that link. Nested calls share the request transaction.
  const current = await req.payload.findByID({ collection: 'users', id: user.id, ...options })
  if (current.customer) return current
  return req.payload.update({
    collection: 'users',
    id: user.id,
    data: { customer: customer.id },
    ...options,
  })
}
