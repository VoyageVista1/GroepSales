type Name = 'plane' | 'arrow-right' | 'arrow-down' | 'search' | 'close' | 'check'

// Lucide outline icons, shared by the public navigation and travel cards.
const paths: Record<Name, string[]> = {
  plane: ['M22 2 9.5 14.5', 'm22 2-8 20-4.5-7.5L2 10Z'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  'arrow-down': ['M12 5v14', 'm5 12 7 7 7-7'],
  search: ['m21 21-4.3-4.3'],
  close: ['m18 6-12 12', 'm6 6 12 12'],
  check: ['m20 6-11 11-5-5'],
}

export default function SiteIcon({ name, className = '' }: { name: Name; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {name === 'search' && <circle cx="11" cy="11" r="8" />}
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
