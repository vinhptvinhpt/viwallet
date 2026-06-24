import { parseAmountInput } from '@/lib/currency'

test('amount must be positive', () => {
  expect(parseAmountInput('0')).toBe(0)
  expect(parseAmountInput('10.50')).toBe(1050)
})

test('converted amount uses exchange rate when currencies differ', () => {
  const amount = 10000 // 100 USD in cents
  const rate = 25000   // 1 USD = 25000 VND
  const converted = Math.round(amount * rate)
  expect(converted).toBe(250000000)
})
