import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isBillUpcoming, daysUntil } from '@/lib/bills'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const bills = await prisma.recurringRule.findMany({
    where: { userId: user.id, isBill: true },
  })

  const upcomingBills = bills
    .filter((bill) => isBillUpcoming(bill.nextDueDate, bill.notifyDaysBefore, now))
    .map((bill) => ({
      id: bill.id,
      name: bill.name,
      nextDueDate: bill.nextDueDate,
      daysUntil: daysUntil(bill.nextDueDate, now),
      template: bill.template,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return NextResponse.json(upcomingBills)
}
