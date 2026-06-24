import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  categoryId: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER', 'DEBT_LOAN']).optional(),
  amount: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  exchangeRate: z.number().positive().nullable().optional(),
  convertedAmount: z.number().int().positive().optional(),
  date: z.string().datetime().optional(),
  note: z.string().max(500).nullable().optional(),
  photos: z.array(z.string()).optional(),
  withPeople: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.date) {
    data.date = new Date(parsed.data.date)
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      wallet: { select: { id: true, name: true, currency: true, color: true } },
      trip: { select: { id: true, name: true } },
    },
  })

  // Correct wallet balance if amount or type changed
  const newAmount = parsed.data.amount ?? existing.amount
  const newType = parsed.data.type ?? existing.type
  const oldDelta = existing.type === 'INCOME' ? existing.amount : -existing.amount
  const newDelta = newType === 'INCOME' ? newAmount : -newAmount
  const balanceDiff = newDelta - oldDelta

  if (balanceDiff !== 0) {
    await prisma.wallet.update({
      where: { id: existing.walletId },
      data: { currentBalance: { increment: balanceDiff } },
    })
  }

  return NextResponse.json(transaction)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const tx = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.transaction.delete({ where: { id } })

  // Reverse the balance effect
  const delta = tx.type === 'INCOME' ? -tx.amount : tx.amount
  await prisma.wallet.update({
    where: { id: tx.walletId },
    data: { currentBalance: { increment: delta } },
  })

  return NextResponse.json({ success: true })
}
