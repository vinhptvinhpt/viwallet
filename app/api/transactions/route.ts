import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const transactionSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string(),
  tripId: z.string().uuid().nullable().optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER', 'DEBT_LOAN']).default('EXPENSE'),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  exchangeRate: z.number().positive().nullable().optional(),
  convertedAmount: z.number().int().positive(),
  date: z.string().datetime(),
  note: z.string().max(500).nullable().optional(),
  photos: z.array(z.string()).default([]),
  withPeople: z.array(z.string()).default([]),
  location: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
})

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '30')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const walletId = searchParams.get('walletId')
  const categoryId = searchParams.get('categoryId')
  const tripId = searchParams.get('tripId')
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(walletId && { walletId }),
      ...(categoryId && { categoryId }),
      ...(tripId && { tripId }),
      ...(type && { type: type as any }),
      ...(from || to ? {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      } : {}),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      wallet: { select: { id: true, name: true, currency: true, color: true } },
      trip: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
    skip: offset,
  })

  return NextResponse.json(transactions)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = transactionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const transaction = await prisma.transaction.create({
    data: { ...parsed.data, userId: user.id, date: new Date(parsed.data.date) },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      wallet: { select: { id: true, name: true, currency: true, color: true } },
      trip: { select: { id: true, name: true } },
    },
  })

  // Update wallet balance: income adds, expense subtracts
  const delta = parsed.data.type === 'INCOME' ? parsed.data.amount : -parsed.data.amount
  await prisma.wallet.update({
    where: { id: parsed.data.walletId },
    data: { currentBalance: { increment: delta } },
  })

  return NextResponse.json(transaction, { status: 201 })
}
