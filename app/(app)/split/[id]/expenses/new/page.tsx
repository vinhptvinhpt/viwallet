import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { ExpenseForm } from '@/components/split/ExpenseForm'

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { id: groupId } = await params
  const data = await getGroupData(groupId, user.id)

  if (!data.success || !data.group) {
    if (data.error?.includes('Unauthorized')) redirect('/split')
    notFound()
  }

  const { group, currentMember } = data

  return (
    <ExpenseForm
      groupId={group.id}
      currency={group.currency}
      members={group.members.map((m: any) => ({
        id: m.id,
        displayName: m.displayName,
      }))}
      currentMemberId={currentMember.id}
    />
  )
}
