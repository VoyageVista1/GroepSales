import type { ReactNode } from 'react'
import HomeAccountNavigation from './HomeAccountNavigation'
import SiteIcon from './SiteIcon'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      aria-label="Voyage Vista home"
      className={`inline-flex! min-h-11! shrink-0! items-center! gap-3! rounded-lg! font-bold! no-underline! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--vv-mint)]! ${light ? 'text-white!' : 'text-[var(--vv-primary)]!'}`}
    >
      <span className="grid! h-11! w-11! place-items-center! rounded-lg! bg-[var(--vv-accent)]! text-white!">
        <SiteIcon name="plane" />
      </span>
      <span className="text-base! font-bold! tracking-[0.15em]!">
        VOYAGE<span className="block! text-sm! tracking-[0.3em]!">VISTA</span>
      </span>
    </a>
  )
}

export default function PublicHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="static! z-10! block! h-auto! w-full! border-0! bg-[var(--vv-nav)]! p-0! text-white!">
      <div className="mx-auto! flex! w-full! max-w-[1280px]! flex-wrap! items-center! justify-between! gap-4! px-4! py-4! sm:px-6! lg:px-8!">
        <Brand light />
        <nav
          aria-label="Hoofdnavigatie"
          className="flex! min-w-0! flex-wrap! items-center! gap-x-4! gap-y-3! text-sm! font-bold!"
        >
          {children ?? (
            <>
              <a
                href="#reisaanbod"
                className="inline-flex! min-h-11! items-center! rounded-lg! px-3! py-2! text-white! no-underline! hover:bg-white/10! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-mint)]!"
              >
                Onze reizen
              </a>
              <a
                href="#werkwijze"
                className="inline-flex! min-h-11! items-center! rounded-lg! px-3! py-2! text-white! no-underline! hover:bg-white/10! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-mint)]!"
              >
                Zo werkt het
              </a>
              <HomeAccountNavigation />
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
