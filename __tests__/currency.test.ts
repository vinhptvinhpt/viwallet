import { formatAmount, convertAmount, parseAmountInput } from '@/lib/currency'

test('formatAmount formats USD cents', () => {
  expect(formatAmount(1000, 'USD')).toBe('$10.00')
})

test('formatAmount formats VND without decimals', () => {
  expect(formatAmount(10000000, 'VND')).toContain('100,000')
})

test('convertAmount applies exchange rate', () => {
  expect(convertAmount(10000, 1.5)).toBe(15000)
})

test('parseAmountInput converts string to cents', () => {
  expect(parseAmountInput('10.50')).toBe(1050)
  expect(parseAmountInput('abc')).toBe(0)
})
