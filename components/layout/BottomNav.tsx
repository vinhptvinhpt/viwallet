'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Plus, Plane, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS_LEFT = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/transactions', icon: List, label: 'Transactions' },
]

const NAV_ITEMS_RIGHT = [
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border border-hairline flex items-end z-50">
      {NAV_ITEMS_LEFT.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            pathname.startsWith(href) ? 'text-primary' : 'text-text-secondary'
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}

      {/* Center add FAB */}
      <div className="flex-1 flex justify-center pb-2">
        <Link
          href="/transactions/new"
          className="w-14 h-14 rounded-[var(--radius-pill)] bg-primary text-white shadow-[var(--shadow-elevated)] flex items-center justify-center -translate-y-4 transition-transform active:scale-95"
          aria-label="Add transaction"
        >
          <Plus size={24} />
        </Link>
      </div>

      {NAV_ITEMS_RIGHT.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            pathname.startsWith(href) ? 'text-primary' : 'text-text-secondary'
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
