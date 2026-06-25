'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const OPTIONS = ['light', 'dark', 'system'] as const

export default function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <div className="p-4 rounded-[var(--radius-lg)] bg-surface border border-hairline mb-2">
      <p className="font-medium mb-3">Appearance</p>
      <div className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setTheme(opt)}
            className={`flex-1 py-2 rounded-[var(--radius-md)] text-sm capitalize transition-colors ${
              mounted && theme === opt ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
