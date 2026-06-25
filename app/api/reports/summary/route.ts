import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : startOfMonth(new Date())
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : endOfMonth(new Date())

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: from, lte: to } },
    include: { category: { select: { name: true, icon: true, color: true } } },
  })

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.convertedAmount, 0)
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.convertedAmount, 0)

  // By category
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number }>()
  for (const tx of transactions.filter(t => t.type === 'EXPENSE')) {
    const key = tx.categoryId
    const existing = catMap.get(key)
    if (existing) existing.amount += tx.convertedAmount
    else catMap.set(key, { ...tx.category, amount: tx.convertedAmount })
  }
  const byCategory = [...catMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 6)

  // By day
  const dayMap = new Map<string, { income: number; expense: number }>()
  for (const tx of transactions) {
    const day = format(tx.date, 'yyyy-MM-dd')
    const existing = dayMap.get(day) ?? { income: 0, expense: 0 }
    if (tx.type === 'INCOME') existing.income += tx.convertedAmount
    if (tx.type === 'EXPENSE') existing.expense += tx.convertedAmount
    dayMap.set(day, existing)
  }
  const byDay = [...dayMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ totalIncome, totalExpense, byCategory, byDay })
}
