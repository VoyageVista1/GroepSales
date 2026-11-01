'use client'

import { useEffect, useState } from 'react'
import { getNavigationRole } from '@/actions/navigation'
import StaffViewSwitch from './StaffViewSwitch'
import SiteIcon from './SiteIcon'

export default function HomeAccountNavigation() {
  const [role, setRole] = useState<'staff' | 'customer' | null>(null)
  useEffect(() => {
    let active = true
    getNavigationRole()
      .then((result) => {
        if (active) setRole(result)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  if (role === 'staff') return <StaffViewSwitch view="home" />
  return (
    <a
      href={role === 'customer' ? '/mijn-account' : '/inloggen'}
      className="inline-flex! min-h-11! items-center! gap-2! rounded-lg! border! border-[var(--vv-mint)]! bg-transparent! px-4! py-3! text-sm! font-bold! text-white! no-underline! hover:bg-white/10! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--vv-mint)]!"
    >
      Mijn Voyage Vista <SiteIcon name="arrow-right" />
    </a>
  )
}
