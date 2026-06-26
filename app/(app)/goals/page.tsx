'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/ui/Skeleton'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalCreateSheet } from '@/components/goals/GoalCreateSheet'
import EmptyState from '@/components/shared/EmptyState'
import type { GoalSummary } from '@/components/goals/GoalCard'

function GoalCardSkeleton() {
  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 border border-hairline space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(data => {
        setGoals(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(goal: GoalSummary) {
    setGoals(prev => [goal, ...prev])
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Goal
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <GoalCardSkeleton />
          <GoalCardSkeleton />
          <GoalCardSkeleton />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No goals yet"
          subtitle="Set a savings target and track your progress."
          actionLabel="Create a goal"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal, i) => (
            <Link key={goal.id} href={`/goals/${goal.id}`} className="block">
              <GoalCard goal={goal} index={i} />
            </Link>
          ))}
        </div>
      )}

      <GoalCreateSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={handleCreated}
      />
    </div>
  )
}
