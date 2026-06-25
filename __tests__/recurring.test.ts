import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

function nextDueDate(frequency: string, from: Date): Date {
  switch (frequency) {
    case 'DAILY': return addDays(from, 1)
    case 'WEEKLY': return addWeeks(from, 1)
    case 'MONTHLY': return addMonths(from, 1)
    case 'YEARLY': return addYears(from, 1)
    default: throw new Error('Unknown frequency')
  }
}

test('daily recurrence adds 1 day', () => {
  const base = new Date('2026-01-01')
  expect(nextDueDate('DAILY', base).toISOString().startsWith('2026-01-02')).toBe(true)
})

test('monthly recurrence adds 1 month', () => {
  const base = new Date('2026-01-15')
  expect(nextDueDate('MONTHLY', base).toISOString().startsWith('2026-02-15')).toBe(true)
})
