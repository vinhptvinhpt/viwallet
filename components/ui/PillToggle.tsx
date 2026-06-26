'use client'

export default function PillToggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-surface-2 rounded-[var(--radius-pill)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-pill)] transition-colors ${
            value === opt.value ? 'bg-hero text-on-hero' : 'text-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
