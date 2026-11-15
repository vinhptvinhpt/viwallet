import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionsView } from '@/components/transactions/TransactionsView'

export default async function TransactionsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const [rawTransactions, rawWallets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 50,
      include: { wallet: true, category: true },
    }),
    prisma.wallet.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const initialTransactions = JSON.parse(JSON.stringify(rawTransactions))
  const initialWallets = JSON.parse(JSON.stringify(rawWallets))

  return (
    <TransactionsView
      initialTransactions={initialTransactions}
      initialWallets={initialWallets}
    />
  )
}
