'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export default function UpdateToast() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reg: ServiceWorkerRegistration | undefined

    const updateFoundHandler = () => {
      const newWorker = reg?.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Update available', {
            action: {
              label: 'Reload',
              onClick: () => {
                const waiting = reg?.waiting
                if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' })
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  window.location.reload()
                }, { once: true })
              },
            },
          })
        }
      })
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return
      reg = registration
      reg.addEventListener('updatefound', updateFoundHandler)
    })

    return () => {
      if (reg) reg.removeEventListener('updatefound', updateFoundHandler)
    }
  }, [])

  return null
}
