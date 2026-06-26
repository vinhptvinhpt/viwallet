import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionsToCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: {
      category: { select: { name: true } },
      wallet: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  })

  const rows = transactions.map((txn) => ({
    date: txn.date.toISOString().split('T')[0], // ISO yyyy-MM-dd
    type: txn.type,
    amount: txn.amount,
    currency: txn.currency,
    category: txn.category.name,
    wallet: txn.wallet.name,
    note: txn.note ?? '',
  }))

  const csv = transactionsToCsv(rows)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="viwallet-transactions.csv"',
    },
  })
}
