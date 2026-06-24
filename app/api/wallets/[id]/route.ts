import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
  })

  if (!wallet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(wallet)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.wallet.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { name, icon, color, currency, type, excludeFromTotal, archived, sortOrder } = body

  const wallet = await prisma.wallet.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(currency !== undefined && { currency }),
      ...(type !== undefined && { type }),
      ...(excludeFromTotal !== undefined && { excludeFromTotal }),
      ...(archived !== undefined && { archived }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })

  return NextResponse.json(wallet)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.wallet.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.wallet.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
