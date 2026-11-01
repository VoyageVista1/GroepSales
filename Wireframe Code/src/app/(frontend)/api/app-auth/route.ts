// Both URLs use exactly the same Payload auth and origin/body validation.
// Keep the old URL working for forms and already-loaded preview clients.
export { GET, POST } from '../../auth/login/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
