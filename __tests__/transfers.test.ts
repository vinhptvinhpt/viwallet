import { transferBalanceDelta, reverseTransferDelta } from '@/lib/transfers'

test('transfer debits source and credits destination', () => {
  const r = transferBalanceDelta(10000, 2000, 3000, 3000)
  expect(r.from).toBe(7000)
  expect(r.to).toBe(5000)
})

test('cross-currency transfer credits toAmount, not amount', () => {
  const r = transferBalanceDelta(10000, 0, 3000, 2550)
  expect(r.from).toBe(7000)
  expect(r.to).toBe(2550)
})

test('reverse restores both balances', () => {
  const r = reverseTransferDelta(7000, 5000, 3000, 3000)
  expect(r.from).toBe(10000)
  expect(r.to).toBe(2000)
})
