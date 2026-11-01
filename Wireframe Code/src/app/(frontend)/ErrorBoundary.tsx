'use client'

import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-error-screen" role="alert">
        <p className="eyebrow">VOYAGE VISTA</p>
        <h1>Dit scherm kon niet worden geladen</h1>
        <p>
          Probeer de pagina opnieuw te laden. Je opgeslagen klanten, aanvragen en offertes blijven
          bewaard.
        </p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Pagina opnieuw laden
        </button>
      </main>
    )
  }
}
