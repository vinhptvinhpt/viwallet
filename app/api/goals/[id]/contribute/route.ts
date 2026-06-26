import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { applyContribution } from '@/lib/goals'

const schema = z.object({
  amount: z.number().int().positive(),
  walletId: z.string().optional(),
  date: z.string(),
  note: z.string().optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = schema.parse(await request.json())
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const next = applyContribution(goal.currentAmount, goal.targetAmount, body.amount)
  const ops: any[] = [
    prisma.goalContribution.create({ data: { goalId: id, amount: body.amount, walletId: body.walletId, date: new Date(body.date), note: body.note } }),
    prisma.savingsGoal.update({ where: { id }, data: { currentAmount: next.currentAmount, status: next.status } }),
  ]
  if (body.walletId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletId, userId: user.id } })
    if (w) ops.push(prisma.wallet.update({ where: { id: w.id }, data: { currentBalance: w.currentBalance - body.amount } }))
  }
  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true, ...next })
}
