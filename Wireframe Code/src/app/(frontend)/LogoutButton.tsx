'use client'

import { useState, useTransition } from 'react'
import { logoutAction } from '@/actions/auth'

export default function LogoutButton({
  className = 'button button-secondary',
}: {
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError('')
            try {
              const result = await logoutAction()
              if (result.ok) window.location.replace('/')
              else setError(result.message)
            } catch {
              setError('Geen verbinding. Probeer opnieuw uit te loggen.')
            }
          })
        }
      >
        {pending ? 'Uitloggen…' : 'Uitloggen'}
      </button>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </>
  )
}
