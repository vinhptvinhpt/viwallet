'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Target, Plane, MoreHorizontal, Goal, CreditCard, BarChart2, Settings, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/transactions', icon: List, label: 'Transactions' },
  { href: '/split', icon: Users, label: 'Split' },
  { href: '/budgets', icon: Target, label: 'Budgets' },
]

const MORE_ITEMS = [
  { href: '/trips', icon: Plane, label: 'Trips' },
  { href: '/goals', icon: Goal, label: 'Goals' },
  { href: '/debts', icon: CreditCard, label: '1-on-1 Debts' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reducedMotion = useAppReducedMotion()
  const moreSheetRef = useRef<HTMLDivElement>(null)

  // Focus management
  useEffect(() => {
    if (open) moreSheetRef.current?.focus()
  }, [open])

  // Escape-to-close
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            onClick={onClose}
          />
          <motion.div
            ref={moreSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-sheet-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-[64px] z-50 bg-surface rounded-t-[var(--radius-lg)] p-5 outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
          >
            <h2 id="more-sheet-title" className="text-sm font-semibold text-text-secondary mb-3">More</h2>
            <div className="grid grid-cols-4 gap-2">
              {MORE_ITEMS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[var(--radius-md)] bg-surface-2 hover:bg-primary/10 transition-colors text-text-secondary"
                >
                  <Icon size={22} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [activeHref, setActiveHref] = useState(pathname)
  const [moreOpen, setMoreOpen] = useState(false)

  // Keep in sync with pathname
  useEffect(() => {
    setActiveHref(pathname)
    setMoreOpen(false)
  }, [pathname])

  const isMoreActive = MORE_ITEMS.some(item => activeHref.startsWith(item.href))

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border-hairline flex z-50">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isSelected = activeHref === href || (href !== '/dashboard' && activeHref.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setActiveHref(href)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-150 active:scale-95',
                isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            isMoreActive || moreOpen ? 'text-primary font-semibold' : 'text-text-secondary'
          )}
        >
          <MoreHorizontal size={20} />
          More
        </button>
      </nav>
    </>
  )
}
