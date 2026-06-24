import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
  const { name, icon, color, currency, initialBalance, type, excludeFromTotal } = body

  if (!name || !currency) {
    return NextResponse.json({ error: 'name and currency are required' }, { status: 400 })
  }

  const balanceCents = typeof initialBalance === 'number' ? initialBalance : 0

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      name,
      icon: icon ?? 'wallet',
      color: color ?? '#2563EB',
      currency,
      initialBalance: balanceCents,
      currentBalance: balanceCents,
      type: type ?? 'CASH',
      excludeFromTotal: excludeFromTotal ?? false,
    },
  })

  return NextResponse.json(wallet, { status: 201 })
}
