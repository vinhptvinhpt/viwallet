'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, History } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatAmount } from '@/lib/currency'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import Confetti from '@/components/motion/Confetti'
import Skeleton from '@/components/ui/Skeleton'
import IconTile from '@/components/shared/IconTile'
import { Button } from '@/components/ui/button'
import { GoalContributeSheet } from '@/components/goals/GoalContributeSheet'
import EmptyState from '@/components/shared/EmptyState'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import { cn } from '@/lib/utils'

interface Contribution {
  id: string
  amount: number
  walletId: string | null
  date: string
  note: string | null
}

interface GoalDetail {
  id: string
  name: string
  icon: string
  color: string
  targetAmount: number
  currentAmount: number
  currency: string
  deadline: string | null
  status: string
  contributions: Contribution[]
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [goal, setGoal] = useState<GoalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContribute, setShowContribute] = useState(false)
  const [fireConfetti, setFireConfetti] = useState(false)
  const completedRef = useRef(false)

  const loadGoal = useCallback(() => {
    fetch(`/api/goals/${id}`)
      .then(r => r.json())
      .then(data => {
        setGoal(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    loadGoal()
  }, [loadGoal])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-5 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 space-y-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1 py-2">
              <Skeleton className="w-9 h-9 rounded-[var(--radius-md)]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="p-6 text-text-secondary text-sm text-center">Goal not found.</div>
    )
  }

  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const isCompleted = goal.status === 'COMPLETED'
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4">
      <Confetti fire={fireConfetti} />

      {/* Back link */}
      <Link
        href="/goals"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Back to Goals
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <IconTile icon={getCategoryIcon(goal.icon)} color={goal.color} size={52} />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{goal.name}</h1>
          {goal.deadline && (
            <p className="text-text-secondary text-sm mt-0.5">
              Due {format(new Date(goal.deadline), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 border border-hairline">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary">Saved</p>
          {isCompleted && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-success)]/15 text-success">
              Completed
            </span>
          )}
        </div>
        <AnimatedNumber
          value={goal.currentAmount}
          format={(n) => formatAmount(Math.round(n), goal.currency)}
          className="text-[32px] font-extrabold tracking-tight text-text-primary"
        />
        <p className="text-xs text-text-secondary mt-0.5">
          of {formatAmount(goal.targetAmount, goal.currency)} goal
        </p>

        {/* Progress bar */}
        <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden mt-3 mb-2">
          <motion.div
            className={cn('h-full rounded-full', isCompleted ? 'bg-success' : 'bg-primary')}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{pct}% complete</span>
          {!isCompleted && <span>{formatAmount(remaining, goal.currency)} remaining</span>}
        </div>
      </div>

      {/* Add contribution button */}
      {!isCompleted && (
        <Button onClick={() => setShowContribute(true)} className="w-full">
          <Plus size={16} className="mr-2" /> Add Contribution
        </Button>
      )}

      {/* Contributions list */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Contributions</h2>
        {goal.contributions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No contributions yet"
            subtitle="Add your first contribution to start tracking progress."
          />
        ) : (
          <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)] border border-hairline">
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {goal.contributions.map((c) => (
                <motion.li
                  key={c.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                  }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <IconTile icon={getCategoryIcon(goal.icon)} color={goal.color} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {c.note ?? 'Contribution'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {format(new Date(c.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success shrink-0">
                    +{formatAmount(c.amount, goal.currency)}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )}
      </div>

      <GoalContributeSheet
        open={showContribute}
        onClose={() => {
          setShowContribute(false)
          if (completedRef.current) {
            completedRef.current = false
            // Fire confetti after sheet exit animation completes (~350ms spring)
            setTimeout(() => { setFireConfetti(true); setTimeout(() => setFireConfetti(false), 1000) }, 400)
          }
        }}
        onSaved={loadGoal}
        onCompleted={() => { completedRef.current = true }}
        goalId={goal.id}
        goalCurrency={goal.currency}
      />
    </div>
  )
}
