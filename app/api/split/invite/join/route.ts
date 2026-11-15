import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { joinGroupByInvite } from '@/lib/split/group-actions'

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { token, claimMemberId, newDisplayName } = body
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    const result = await joinGroupByInvite(user.id, token, { claimMemberId, newDisplayName })
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
