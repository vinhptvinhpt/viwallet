'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'viwallet:install-dismissed'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or running in standalone mode
    if (
      localStorage.getItem(DISMISSED_KEY) ||
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || !deferredPrompt) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
    setDeferredPrompt(null)
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-surface border border-hairline rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] px-4 py-3 sm:left-auto sm:right-4 sm:max-w-sm"
      role="banner"
    >
      <p className="text-sm text-text-primary flex-1">
        Install ViWallet for a better experience
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-primary text-white text-sm font-medium px-3 py-1.5 rounded-[var(--radius-pill)] hover:opacity-90 transition-opacity"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
