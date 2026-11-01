'use client'

type View = 'portal' | 'home'

export default function StaffViewSwitch({
  view,
  onViewChange,
}: {
  view: View
  onViewChange?: (view: View) => void
}) {
  return (
    <div
      role="group"
      aria-label="Wisselen van omgeving"
      data-staff-view={view}
      className="inline-flex! max-w-full! flex-wrap! gap-1! rounded-lg! border! border-[var(--vv-border)]! bg-white! p-1!"
    >
      {(
        [
          { id: 'portal', label: 'Medewerkersportaal', href: '/mijn-account' },
          { id: 'home', label: 'Hoofdpagina', href: '/' },
        ] as const
      ).map((item) => {
        const selected = view === item.id
        const className = `inline-flex! min-h-11! w-auto! items-center! justify-center! rounded-lg! border-0! px-3! py-2! text-sm! font-bold! no-underline! transition! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[var(--vv-accent-strong)]! ${selected ? 'bg-[var(--vv-primary)]! text-white!' : 'bg-white! text-[var(--vv-primary)]! hover:bg-[var(--vv-subtle)]!'}`
        return onViewChange ? (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            className={className}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </button>
        ) : (
          <a
            key={item.id}
            href={item.href}
            aria-current={selected ? 'page' : undefined}
            className={className}
          >
            {item.label}
          </a>
        )
      })}
    </div>
  )
}
