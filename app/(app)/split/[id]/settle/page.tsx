import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { SettleForm } from '@/components/split/SettleForm'

export default async function SettlePage({
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
    <SettleForm
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
