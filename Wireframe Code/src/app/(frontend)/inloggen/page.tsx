import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { loginMessages } from '@/lib/auth-validation'
import AuthPanel from '../AuthPanel'

export const metadata = {
  title: 'Inloggen | Voyage Vista',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    auth?: string | string[]
    next?: string | string[]
    trip?: string | string[]
  }>
}) {
  const { auth, next, trip } = await searchParams
  const user = await appAuth.currentUser()
  if (user)
    redirect(
      next === 'reiswens'
        ? '/mijn-account?next=reiswens'
        : typeof trip === 'string' && trip.length <= 120
          ? `/mijn-account?trip=${encodeURIComponent(trip)}`
          : '/mijn-account',
    )
  return (
    <AuthPanel
      initialMessage={
        auth === 'check'
          ? 'Je sessie is niet teruggekomen na het inloggen. Probeer opnieuw, of open de app buiten het voorbeeldvenster en controleer of cookies zijn toegestaan.'
          : typeof auth === 'string' && Object.hasOwn(loginMessages, auth)
            ? loginMessages[auth as keyof typeof loginMessages]
            : ''
      }
    />
  )
}
