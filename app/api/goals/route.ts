import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  targetAmount: z.number().int().positive(),
  currency: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  deadline: z.string().optional(),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    include: { _count: { select: { contributions: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(goals)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = schema.parse(await request.json())
  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: body.name,
      targetAmount: body.targetAmount,
      currency: body.currency,
      icon: body.icon,
      color: body.color,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}
