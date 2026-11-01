import AuthFormPanel from './AuthFormPanel'

function Plane() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

// The page shell and public navigation are rendered by the server.
export default function AuthPanel({ initialMessage = '' }: { initialMessage?: string }) {
  return (
    <main className="m-0! grid! min-h-svh! w-full! max-w-none! bg-[var(--vv-page)]! p-0! lg:grid-cols-[1fr_1.05fr]!">
      <aside
        className="relative! flex! flex-col! justify-between! overflow-hidden! bg-[var(--vv-primary)]! px-7! py-8! text-white! sm:px-12! lg:p-16!"
        aria-label="Voyage Vista"
      >
        <div className="relative! z-10! flex! items-center! gap-3!">
          <span className="grid! h-12! w-12! place-items-center! rounded-xl! bg-[var(--vv-accent)]!">
            <Plane />
          </span>
          <span className="text-lg! font-bold! tracking-[0.15em]!">
            VOYAGE
            <span className="block! text-sm! tracking-[0.45em]! text-[var(--vv-mint)]!">VISTA</span>
          </span>
        </div>
        <div className="relative! z-10! my-10! max-w-lg! lg:my-20!">
          <p className="mb-5! text-sm! font-bold! tracking-[0.22em]! text-[var(--vv-mint)]!">
            PERSOONLIJK. VERTROUWD. VERBONDEN.
          </p>
          <h1 className="text-4xl! font-bold! leading-[1.08]! text-white! sm:text-5xl! lg:text-6xl!">
            Elke mooie reis
            <br />
            begint met contact.
          </h1>
          <p className="mt-6! max-w-sm! text-lg! leading-relaxed! text-white/75!">
            Je reizen, voorstellen en contact met Voyage Vista. Alles bij elkaar, in je eigen
            omgeving.
          </p>
          <div className="mt-10! hidden! gap-4! border-t! border-white/20! pt-7! text-sm! text-white/80! lg:flex!">
            <span aria-hidden="true">✦</span>
            <p className="text-white/80!">Van het eerste reisidee tot het moment van vertrek.</p>
          </div>
        </div>
        <p className="relative! z-10! hidden! text-sm! tracking-wide! text-white/70! lg:block!">
          VOYAGE VISTA · JOUW REIS, ONZE AANDACHT
        </p>
        <div
          className="pointer-events-none! absolute! -bottom-44! -right-44! h-[520px]! w-[520px]! rounded-full! border! border-white/10!"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none! absolute! -bottom-28! -right-28! h-[390px]! w-[390px]! rounded-full! border! border-white/10!"
          aria-hidden="true"
        />
      </aside>
      <section
        className="flex! items-center! justify-center! px-6! py-12! sm:px-12! lg:py-20!"
        aria-labelledby="auth-title"
      >
        <div className="w-full! max-w-[410px]!">
          <a
            href="/"
            className="mb-8! inline-flex! rounded! py-2! text-sm! font-bold! text-[var(--vv-primary)]! underline! underline-offset-4!"
          >
            ← Reizen bekijken zonder account
          </a>
          <AuthFormPanel initialMessage={initialMessage} />
        </div>
      </section>
    </main>
  )
}
