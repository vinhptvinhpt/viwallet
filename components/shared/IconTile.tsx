import type { LucideIcon } from 'lucide-react'
import { categoryTint } from './categoryTint'

export default function IconTile({
  icon: Icon,
  color,
  size = 40,
}: {
  icon: LucideIcon
  color?: string
  size?: number
}) {
  const { bg, fg } = categoryTint(color ?? '')
  return (
    <div
      className="flex items-center justify-center rounded-[var(--radius-md)] shrink-0"
      style={{ width: size, height: size, background: bg, color: fg }}
    >
      <Icon size={size * 0.45} />
    </div>
  )
}
