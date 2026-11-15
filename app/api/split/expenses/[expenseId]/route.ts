import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { updateExpense, deleteExpense } from '@/lib/split/expense-actions'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { expenseId } = await params
  try {
    const body = await req.json()
    const result = await updateExpense(user.id, { ...body, expenseId })
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { expenseId } = await params
  try {
    const result = await deleteExpense(user.id, expenseId)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
