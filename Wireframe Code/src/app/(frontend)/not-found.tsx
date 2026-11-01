import Link from 'next/link'
import PublicHeader from './PublicHeader'

export default function NotFound() {
  return (
    <>
      <PublicHeader>
        <Link
          href="/"
          className="inline-flex! min-h-11! items-center! rounded-lg! px-3! text-white!"
        >
          Naar de hoofdpagina
        </Link>
      </PublicHeader>
      <main className="mx-auto! flex! min-h-[50svh]! w-full! max-w-2xl! flex-col! items-center! justify-center! gap-6! px-4! py-8! text-center!">
        <p className="text-sm! font-bold! text-[var(--vv-accent-strong)]!">PAGINA NIET GEVONDEN</p>
        <h1 className="text-[32px]! font-bold! text-[var(--vv-primary)]!">
          Deze bestemming bestaat niet
        </h1>
        <p className="text-base! text-[var(--vv-muted)]!">
          De pagina die je zoekt bestaat niet of is verplaatst. Bekijk ons reisaanbod of ga naar je
          account.
        </p>
        <div className="flex! flex-wrap! justify-center! gap-3!">
          <Link className="button button-primary no-underline!" href="/">
            Bekijk onze reizen
          </Link>
          <Link className="button button-secondary no-underline!" href="/mijn-account">
            Mijn Voyage Vista
          </Link>
        </div>
      </main>
    </>
  )
}
