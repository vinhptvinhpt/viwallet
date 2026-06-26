import { daysUntil, isBillUpcoming } from '@/lib/bills'

const now = new Date('2026-06-25T00:00:00Z')

test('daysUntil counts whole days ahead', () => {
  expect(daysUntil(new Date('2026-06-28T00:00:00Z'), now)).toBe(3)
})

test('bill is upcoming when within notify window', () => {
  expect(isBillUpcoming(new Date('2026-06-26T00:00:00Z'), 2, now)).toBe(true)
})

test('bill is not upcoming when beyond window', () => {
  expect(isBillUpcoming(new Date('2026-07-10T00:00:00Z'), 2, now)).toBe(false)
})
