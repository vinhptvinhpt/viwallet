import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

function calcNextDue(frequency: string, from: Date): Date {
  switch (frequency) {
    case 'DAILY': return addDays(from, 1)
    case 'WEEKLY': return addWeeks(from, 1)
    case 'MONTHLY': return addMonths(from, 1)
    case 'YEARLY': return addYears(from, 1)
    default: return addMonths(from, 1)
  }
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dueRules = await prisma.recurringRule.findMany({
    where: { nextDueDate: { lte: new Date() } },
  })

  let created = 0

  for (const rule of dueRules) {
    const template = rule.template as any

    await prisma.transaction.create({
      data: {
        userId: rule.userId,
        walletId: template.walletId,
        categoryId: template.categoryId,
        type: template.type ?? 'EXPENSE',
        amount: template.amount,
        currency: template.currency,
        convertedAmount: template.convertedAmount ?? template.amount,
        date: new Date(),
        note: template.note ?? null,
        photos: [],
        withPeople: [],
        isRecurring: true,
        recurringRuleId: rule.id,
      },
    })

    const delta =
      (template.type ?? 'EXPENSE') === 'INCOME' ? template.amount : -template.amount
    await prisma.wallet.update({
      where: { id: template.walletId },
      data: { currentBalance: { increment: delta } },
    })

    await prisma.recurringRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: new Date(),
        nextDueDate: calcNextDue(rule.frequency, rule.nextDueDate),
      },
    })

    created++
  }

  return NextResponse.json({ created })
}
