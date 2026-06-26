import { applyContribution } from '@/lib/goals'

test('contribution increments currentAmount and stays active below target', () => {
  const r = applyContribution(5000, 30000, 2000)
  expect(r.currentAmount).toBe(7000)
  expect(r.status).toBe('ACTIVE')
})

test('reaching target marks completed', () => {
  const r = applyContribution(28000, 30000, 2000)
  expect(r.currentAmount).toBe(30000)
  expect(r.status).toBe('COMPLETED')
})

test('overshooting target still completes', () => {
  const r = applyContribution(29000, 30000, 5000)
  expect(r.status).toBe('COMPLETED')
})
