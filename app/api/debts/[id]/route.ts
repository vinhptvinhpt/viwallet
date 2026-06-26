import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  counterparty: z.string().optional(),
  dueDate: z.string().optional(),
  note: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const debt = await prisma.debt.findFirst({
    where: { id, userId: user.id },
    include: { payments: { orderBy: { date: 'desc' } } },
  })
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(debt)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const debt = await prisma.debt.findFirst({ where: { id, userId: user.id } })
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = updateSchema.parse(await request.json())
  const updated = await prisma.debt.update({
    where: { id },
    data: {
      counterparty: body.counterparty,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      note: body.note,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const debt = await prisma.debt.findFirst({ where: { id, userId: user.id } })
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const payments = await prisma.debtPayment.findMany({ where: { debtId: id } })
  const walletUpdates: Array<{ id: string; currentBalance: number }> = []
  for (const p of payments) {
    if (!p.walletId) continue
    const w = await prisma.wallet.findUnique({ where: { id: p.walletId } })
    if (!w) continue
    const reversed = debt.direction === 'I_OWE'
      ? w.currentBalance + p.amount
      : w.currentBalance - p.amount
    walletUpdates.push({ id: p.walletId, currentBalance: reversed })
  }

  await prisma.$transaction([
    ...walletUpdates.map(wu => prisma.wallet.update({ where: { id: wu.id }, data: { currentBalance: wu.currentBalance } })),
    prisma.debtPayment.deleteMany({ where: { debtId: id } }),
    prisma.debt.delete({ where: { id } }),
  ])
  return NextResponse.json({ ok: true })
}
