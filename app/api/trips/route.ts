import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const tripSchema = z.object({
  name: z.string().min(1).max(100),
  baseCurrency: z.string().length(3),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  budgetAmount: z.number().int().positive().nullable().optional(),
  people: z.array(z.string()).default([]),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(trips)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = tripSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const trip = await prisma.trip.create({
    data: {
      ...parsed.data,
      userId: user.id,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  })
  return NextResponse.json(trip, { status: 201 })
}
