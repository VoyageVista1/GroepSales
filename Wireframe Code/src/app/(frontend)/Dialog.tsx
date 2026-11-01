'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const openDialogs: HTMLElement[] = []
let originalBodyOverflow = ''
export default function Dialog({
  children,
  className,
  titleId,
  onClose,
}: {
  children: ReactNode
  className: string
  titleId: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement as HTMLElement | null
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0)
    if (!openDialogs.length) {
      originalBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openDialogs.push(dialog)
    ;(dialog.querySelector<HTMLElement>('.close') ?? focusable()[0] ?? dialog).focus()
    const isTop = () => openDialogs.at(-1) === dialog
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current()
      }
      if (event.key === 'Tab') {
        const elements = focusable()
        const first = elements[0] ?? dialog
        const last = elements.at(-1) ?? dialog
        if (
          !dialog.contains(document.activeElement) ||
          (event.shiftKey ? document.activeElement === first : document.activeElement === last)
        ) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
      }
    }
    const focusin = (event: FocusEvent) => {
      if (isTop() && !dialog.contains(event.target as Node)) (focusable()[0] ?? dialog).focus()
    }
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focusin)
    return () => {
      openDialogs.splice(openDialogs.indexOf(dialog), 1)
      if (!openDialogs.length) document.body.style.overflow = originalBodyOverflow
      document.removeEventListener('keydown', keydown, true)
      document.removeEventListener('focusin', focusin)
      if (opener?.isConnected) opener.focus()
      else document.querySelector<HTMLElement>('[aria-current="page"]')?.focus()
    }
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onClick={(event) => {
        if (className.split(' ').includes('overlay') && event.target === event.currentTarget)
          close.current()
      }}
    >
      {children}
    </div>
  )
}
