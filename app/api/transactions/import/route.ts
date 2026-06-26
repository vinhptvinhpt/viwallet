import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseImportRow } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const rows = body.rows ?? []

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows must be an array' }, { status: 400 })
  }

  // Parse and resolve categories/wallets
  const errors: Array<{ row: unknown; error: string }> = []
  const creates: Array<{
    walletId: string
    categoryId: string
    type: 'EXPENSE' | 'INCOME'
    amount: number
    currency: string
    convertedAmount: number
    date: Date
    note: string
  }> = []
  const walletDeltas: Map<string, number> = new Map()

  // Get user's wallets and categories
  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  })

  const userCategories = await prisma.category.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, type: true },
  })

  const systemCategories = await prisma.category.findMany({
    where: { userId: null },
    select: { id: true, name: true, type: true },
  })

  const allCategories = [...userCategories, ...systemCategories]

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const parsed = parseImportRow(raw)

    if (!parsed.ok) {
      errors.push({ row: raw, error: parsed.error })
      continue
    }

    const row = parsed.value

    // Resolve wallet by name
    const wallet = wallets.find((w) => w.name === row.wallet)
    if (!wallet) {
      errors.push({ row: raw, error: `Wallet "${row.wallet}" not found` })
      continue
    }

    // Resolve category by name
    // Priority: user category, then system category, then fallback
    let category = userCategories.find((c) => c.name === row.category)
    if (!category) {
      category = systemCategories.find((c) => c.name === row.category)
    }

    // Fallback to "Other Expense" or "Other Income"
    if (!category) {
      const fallbackName = row.type === 'EXPENSE' ? 'Other Expense' : 'Other Income'
      category = allCategories.find((c) => c.name === fallbackName)
    }

    if (!category) {
      errors.push({ row: raw, error: `Category "${row.category}" not found and no fallback available` })
      continue
    }

    // Validate category type matches transaction type
    if (category.type !== row.type) {
      errors.push({ row: raw, error: `Category type "${category.type}" does not match transaction type "${row.type}"` })
      continue
    }

    // Create transaction
    creates.push({
      walletId: wallet.id,
      categoryId: category.id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      convertedAmount: row.amount, // Same currency, so same amount
      date: new Date(row.date),
      note: row.note,
    })

    // Track balance delta
    const delta = row.type === 'INCOME' ? row.amount : -row.amount
    walletDeltas.set(wallet.id, (walletDeltas.get(wallet.id) ?? 0) + delta)
  }

  // Bulk create transactions and update wallet balances in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const created = await Promise.all(
      creates.map((c) =>
        tx.transaction.create({
          data: {
            ...c,
            userId: user.id,
          },
          include: {
            category: { select: { id: true, name: true } },
            wallet: { select: { id: true, name: true } },
          },
        })
      )
    )

    // Update wallet balances
    for (const [walletId, delta] of walletDeltas.entries()) {
      await tx.wallet.update({
        where: { id: walletId },
        data: { currentBalance: { increment: delta } },
      })
    }

    return created
  })

  return NextResponse.json({
    created: result.length,
    errors,
  })
}
