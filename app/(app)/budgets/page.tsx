'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetModal } from '@/components/budgets/BudgetModal'
import { Button } from '@/components/ui/button'
import type { BudgetWithSpent, Budget } from '@/types'

export const dynamic = 'force-dynamic'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/budgets').then(r => r.json()).then(setBudgets)
  }, [])

  function handleSave(budget: Budget) {
    // Optimistically add with spent=0; next fetch will have real data
    setBudgets(prev => [...prev, { ...budget, spent: 0, category: null }])
  }

  const envelopes = budgets.filter(b => b.type === 'ENVELOPE')
  const limits = budgets.filter(b => b.type === 'LIMIT')

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
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
            {limits.map(b => <BudgetCard key={b.id} budget={b} />)}
            {limits.length === 0 && <p className="text-slate-400 text-center py-12">No spending limits set.</p>}
          </div>
        </TabsContent>
        <TabsContent value="envelopes">
          <div className="flex flex-col gap-3">
            {envelopes.map(b => <BudgetCard key={b.id} budget={b} />)}
            {envelopes.length === 0 && <p className="text-slate-400 text-center py-12">No envelopes set.</p>}
          </div>
        </TabsContent>
      </Tabs>
      <BudgetModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
    </div>
  )
}
