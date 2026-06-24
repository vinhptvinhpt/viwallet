test('budget alert threshold triggers at configured percentage', () => {
  const budget = { amount: 100000, alertThreshold: 80 }
  const spent = 85000
  const pct = Math.round((spent / budget.amount) * 100)
  expect(pct).toBe(85)
  expect(pct >= budget.alertThreshold).toBe(true)
})

test('budget remaining is never negative in display', () => {
  const budget = { amount: 50000 }
  const spent = 75000
  const remaining = Math.max(0, budget.amount - spent)
  expect(remaining).toBe(0)
})
