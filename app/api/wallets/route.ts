import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const walletSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().default('wallet'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  currency: z.string().length(3),
  initialBalance: z.number().int().default(0),
  type: z.enum(['CASH', 'CARD', 'BANK', 'EWALLET']).default('CASH'),
  excludeFromTotal: z.boolean().default(false),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(wallets)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = walletSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const wallet = await prisma.wallet.create({
    data: {
      ...parsed.data,
      currentBalance: parsed.data.initialBalance,
      userId: user.id,
    },
  })
  return NextResponse.json(wallet, { status: 201 })
}
