import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { transferBalanceDelta } from '@/lib/transfers'

const schema = z.object({
  fromWalletId: z.string(),
  toWalletId: z.string(),
  amount: z.number().int().positive(),
  toAmount: z.number().int().positive(),
  exchangeRate: z.number().optional(),
  date: z.string(),
  note: z.string().optional(),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const transfers = await prisma.transfer.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(transfers)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = schema.parse(await request.json())
  if (body.fromWalletId === body.toWalletId)
    return NextResponse.json({ error: 'Wallets must differ' }, { status: 400 })

  const [from, to] = await Promise.all([
    prisma.wallet.findFirst({ where: { id: body.fromWalletId, userId: user.id } }),
    prisma.wallet.findFirst({ where: { id: body.toWalletId, userId: user.id } }),
  ])
  if (!from || !to) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

  const delta = transferBalanceDelta(from.currentBalance, to.currentBalance, body.amount, body.toAmount)
  const [transfer] = await prisma.$transaction([
    prisma.transfer.create({ data: { ...body, userId: user.id, date: new Date(body.date) } }),
    prisma.wallet.update({ where: { id: from.id }, data: { currentBalance: delta.from } }),
    prisma.wallet.update({ where: { id: to.id }, data: { currentBalance: delta.to } }),
  ])
  return NextResponse.json(transfer, { status: 201 })
}
