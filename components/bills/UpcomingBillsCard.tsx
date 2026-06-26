'use client'
import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/shared/EmptyState'

interface Bill {
  id: string
  name: string
  nextDueDate: string
  daysUntil: number
  template: unknown
}

export function UpcomingBillsCard() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch('/api/bills/upcoming')
        if (res.ok) {
          const data = await res.json()
          setBills(data)
        }
      } catch (error) {
        console.error('Failed to fetch upcoming bills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleEnableReminders = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        // Fire notification for bills due today/tomorrow
        const urgentBills = bills.filter((b) => b.daysUntil <= 1)
        for (const bill of urgentBills) {
          new Notification(`Bill due: ${bill.name}`, {
            body: `Due in ${bill.daysUntil} day${bill.daysUntil !== 1 ? 's' : ''}`,
            tag: `bill-${bill.id}`,
          })
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
        <p className="text-sm font-semibold text-text-secondary mb-3">Upcoming Bills</p>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (bills.length === 0) {
    return (
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
        <p className="text-sm font-semibold text-text-secondary mb-3">Upcoming Bills</p>
        <EmptyState icon={Receipt} title="No upcoming bills" subtitle="All clear — no bills due soon." />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
      <p className="text-sm font-semibold text-text-secondary mb-3">Upcoming Bills</p>

      <div className="space-y-2 mb-4">
        {bills.map((bill) => {
          const isDangerous = bill.daysUntil <= 1
          const badgeColor = isDangerous ? 'text-danger' : 'text-warning'

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between py-2 px-3 bg-surface-2 rounded-[var(--radius-md)]"
            >
              <p className="text-sm text-text-primary">{bill.name}</p>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badgeColor)}>
                {bill.daysUntil}d
              </span>
            </div>
          )
        })}
      </div>

      {notificationPermission !== 'granted' && !dismissed && (
        <div className="flex gap-2">
          <button
            onClick={handleEnableReminders}
            className="flex-1 text-xs font-semibold px-3 py-2 rounded-[var(--radius-md)] bg-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            Enable Reminders
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs font-semibold px-3 py-2 rounded-[var(--radius-md)] bg-surface-2 text-text-secondary hover:opacity-90 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
