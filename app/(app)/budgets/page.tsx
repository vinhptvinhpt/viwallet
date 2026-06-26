'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetModal } from '@/components/budgets/BudgetModal'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/ui/Skeleton'
import type { BudgetWithSpent, Budget } from '@/types'

function BudgetCardSkeleton() {
  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-[var(--radius-md)]" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/budgets')
      .then(r => r.json())
      .then(data => {
        setBudgets(data)
        setLoading(false)
      })
  }, [])

  function handleSave(budget: Budget) {
    // Optimistically add with spent=0; next fetch will have real data
    setBudgets(prev => [...prev, { ...budget, spent: 0, category: null }])
  }

  const envelopes = budgets.filter(b => b.type === 'ENVELOPE')
  const limits = budgets.filter(b => b.type === 'LIMIT')

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Budgets</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-2" /> Add Budget
        </Button>
      </div>

      <Tabs defaultValue="limits">
        <TabsList className="bg-surface-2 mb-4">
          <TabsTrigger value="limits">Spending Limits</TabsTrigger>
          <TabsTrigger value="envelopes">Envelopes</TabsTrigger>
        </TabsList>

        <TabsContent value="limits">
          <div className="flex flex-col gap-3">
            {loading ? (
              <>
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
              </>
            ) : limits.length === 0 ? (
              <p className="text-text-secondary text-center py-12">No spending limits set.</p>
            ) : (
              limits.map(b => <BudgetCard key={b.id} budget={b} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="envelopes">
          <div className="flex flex-col gap-3">
            {loading ? (
              <>
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
              </>
            ) : envelopes.length === 0 ? (
              <p className="text-text-secondary text-center py-12">No envelopes set.</p>
            ) : (
              envelopes.map(b => <BudgetCard key={b.id} budget={b} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BudgetModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
    </div>
  )
}
