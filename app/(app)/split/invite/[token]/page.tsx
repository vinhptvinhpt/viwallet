import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getGroupByInviteToken } from '@/lib/split/group-actions'
import { InviteClaimView } from '@/components/split/InviteClaimView'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const user = await getUser()
  if (!user) redirect(`/login?returnTo=/split/invite/${token}`)

  const data = await getGroupByInviteToken(token)

  if (!data.success || !data.group) {
    notFound()
  }

  const { group } = data

  // If user is already a member, take them straight to the group
  const alreadyMember = group.members.some((m: any) => m.userId === user.id)
  if (alreadyMember) {
    redirect(`/split/${group.id}`)
  }

  return (
    <InviteClaimView
      groupId={group.id}
      groupName={group.name}
      currency={group.currency}
      token={token}
      creatorName={group.createdBy?.name || 'A group admin'}
      unclaimedMembers={group.unclaimedMembers}
      currentUserDisplayName={user.name || user.email.split('@')[0]}
    />
  )
}
