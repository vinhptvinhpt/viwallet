'use client'
import { useState } from 'react'

interface AmountInputProps {
  value: number // cents
  onChange: (cents: number) => void
  currency: string
}

export function AmountInput({ value, onChange, currency }: AmountInputProps) {
  const [display, setDisplay] = useState(value ? (value / 100).toString() : '')

  function handleKey(key: string) {
    let next = display
    if (key === 'DEL') {
      next = display.slice(0, -1)
    } else if (key === '.' && display.includes('.')) {
      return
    } else {
      next = display + key
    }
    setDisplay(next)
    const num = parseFloat(next)
    onChange(isNaN(num) ? 0 : Math.round(num * 100))
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL']

  return (
    <div>
      <div className="text-center py-4">
        <span className="text-slate-400 text-lg mr-2">{currency}</span>
        <span className="text-4xl font-bold tabular-nums">{display || '0'}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {keys.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            className="h-14 rounded-xl bg-surface-2 text-white text-xl font-medium hover:bg-white/10 active:scale-95 transition-transform"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
