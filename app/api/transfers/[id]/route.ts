import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reverseTransferDelta } from '@/lib/transfers'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const t = await prisma.transfer.findFirst({ where: { id, userId: user.id } })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [from, to] = await Promise.all([
    prisma.wallet.findUnique({ where: { id: t.fromWalletId } }),
    prisma.wallet.findUnique({ where: { id: t.toWalletId } }),
  ])
  const delta = reverseTransferDelta(from!.currentBalance, to!.currentBalance, t.amount, t.toAmount)
  await prisma.$transaction([
    prisma.wallet.update({ where: { id: t.fromWalletId }, data: { currentBalance: delta.from } }),
    prisma.wallet.update({ where: { id: t.toWalletId }, data: { currentBalance: delta.to } }),
    prisma.transfer.delete({ where: { id } }),
  ])
  return NextResponse.json({ ok: true })
}
