import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { prisma } from '@/lib/prisma'
import { ExpenseForm } from '@/components/split/ExpenseForm'

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { id: groupId, expenseId } = await params
  const data = await getGroupData(groupId, user.id)

  if (!data.success || !data.group) {
    if (data.error?.includes('Unauthorized')) redirect('/split')
    notFound()
  }

  const { group, currentMember } = data

  const expense = await prisma.groupExpense.findUnique({
    where: { id: expenseId },
    include: { shares: true },
  })

  if (!expense || expense.groupId !== groupId || expense.deletedAt) {
    notFound()
  }

  return (
    <ExpenseForm
      groupId={group.id}
      currency={group.currency}
      members={group.members.map((m: any) => ({
        id: m.id,
        displayName: m.displayName,
      }))}
      currentMemberId={currentMember.id}
      initialData={{
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidByMemberId: expense.paidByMemberId,
        splitMode: expense.splitMode as any,
        expenseDate: expense.expenseDate.toISOString(),
        shares: expense.shares,
      }}
    />
  )
}
