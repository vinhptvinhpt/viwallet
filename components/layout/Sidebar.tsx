'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Target, Plane, BarChart2, Settings, Goal, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/theme/ThemeToggle'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/transactions', icon: List, label: 'Transactions' },
  { href: '/split', icon: Users, label: 'Split & Debts' },
  { href: '/budgets', icon: Target, label: 'Budgets' },
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/goals', icon: Goal, label: 'Goals' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [activeHref, setActiveHref] = useState(pathname)

  useEffect(() => {
    setActiveHref(pathname)
  }, [pathname])

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface border-r border-hairline p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">ViWallet</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isSelected = activeHref === href || (href !== '/dashboard' && activeHref.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setActiveHref(href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 active:scale-[0.98]',
                isSelected
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto pt-4 px-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}
