'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Target, Plane, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/transactions', icon: List, label: 'Transactions' },
  { href: '/budgets', icon: Target, label: 'Budgets' },
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border-hairline flex z-50">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
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
