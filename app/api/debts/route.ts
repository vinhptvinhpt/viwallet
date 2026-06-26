import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  direction: z.enum(['I_OWE', 'OWED_TO_ME']),
  counterparty: z.string(),
  amount: z.number().int().positive(),
  currency: z.string(),
  dueDate: z.string().optional(),
  note: z.string().optional(),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(debts)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = schema.parse(await request.json())
  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      direction: body.direction,
      counterparty: body.counterparty,
      amount: body.amount,
      remainingAmount: body.amount,
      currency: body.currency,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      note: body.note,
    },
  })
  return NextResponse.json(debt, { status: 201 })
}
