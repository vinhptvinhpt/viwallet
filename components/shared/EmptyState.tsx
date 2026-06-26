import type { LucideIcon } from 'lucide-react'
import IconTile from '@/components/shared/IconTile'

export default function EmptyState({
  icon, title, subtitle, actionLabel, onAction,
}: {
  icon: LucideIcon; title: string; subtitle?: string
  actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <IconTile icon={icon} size={56} />
      <p className="mt-4 font-semibold text-text-primary">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-text-secondary max-w-xs">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-5 bg-primary text-white rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-medium active:scale-[0.97] transition-transform">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
