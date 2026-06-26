import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().optional(),
  targetAmount: z.number().int().positive().optional(),
  deadline: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
    include: { contributions: { orderBy: { date: 'desc' } } },
  })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(goal)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = updateSchema.parse(await request.json())
  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: body.name,
      targetAmount: body.targetAmount,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      icon: body.icon,
      color: body.color,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.savingsGoal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
