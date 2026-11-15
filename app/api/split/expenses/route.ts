import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { createExpense, updateExpense, deleteExpense } from '@/lib/split/expense-actions'

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = await createExpense(user.id, body)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
