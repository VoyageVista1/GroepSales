'use server'

import { appAuth } from '@/lib/app-auth'

// Navigation consumes the existing verified session. No user document enters
// the public page cache, and this result does not grant access to any route.
export async function getNavigationRole(): Promise<'staff' | 'customer' | null> {
  const user = await appAuth.currentUser()
  return user?.role === 'staff' || user?.role === 'customer' ? user.role : null
}
