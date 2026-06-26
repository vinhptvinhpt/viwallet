'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export default function UpdateToast() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return

      const updateFoundHandler = () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            toast('Update available', {
              action: {
                label: 'Reload',
                onClick: () => {
                  const waiting = registration.waiting
                  if (waiting) {
                    waiting.postMessage({ type: 'SKIP_WAITING' })
                  }
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload()
                  }, { once: true })
                },
              },
            })
          }
        })
      }

      registration.addEventListener('updatefound', updateFoundHandler)
      return () => registration.removeEventListener('updatefound', updateFoundHandler)
    })
  }, [])

  return null
}
