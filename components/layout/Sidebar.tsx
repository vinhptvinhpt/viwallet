'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Target, Plane, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/theme/ThemeToggle'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/transactions', icon: List, label: 'Transactions' },
  { href: '/budgets', icon: Target, label: 'Budgets' },
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface border-r border border-hairline p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-text-primary">ViWallet</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-surface-2'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 px-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}
