import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { applyPayment, walletDeltaForPayment } from '@/lib/debts'

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
  const debt = await prisma.debt.findFirst({ where: { id, userId: user.id } })
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const next = applyPayment(debt.remainingAmount, body.amount)
  const ops: any[] = [
    prisma.debtPayment.create({ data: { debtId: id, amount: body.amount, walletId: body.walletId, date: new Date(body.date), note: body.note } }),
    prisma.debt.update({ where: { id }, data: { remainingAmount: next.remaining, status: next.status } }),
  ]
  if (body.walletId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletId, userId: user.id } })
    if (w) {
      const newBalance = walletDeltaForPayment(debt.direction, w.currentBalance, body.amount)
      ops.push(prisma.wallet.update({ where: { id: w.id }, data: { currentBalance: newBalance } }))
    }
  }
  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true, ...next })
}
