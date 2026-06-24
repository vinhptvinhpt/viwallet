import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const trip = await prisma.trip.findFirst({
    where: { id, userId: user.id },
    include: {
      transactions: {
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          wallet: { select: { id: true, name: true, currency: true, color: true } },
        },
        orderBy: { date: 'desc' },
      },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalSpent = trip.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  return NextResponse.json({ ...trip, totalSpent })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.trip.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
