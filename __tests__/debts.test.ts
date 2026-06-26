import { applyPayment, walletDeltaForPayment } from '@/lib/debts'

test('partial payment reduces remaining, stays open', () => {
  const r = applyPayment(10000, 4000)
  expect(r.remaining).toBe(6000)
  expect(r.status).toBe('OPEN')
})

test('full payment settles and clamps at zero', () => {
  const r = applyPayment(4000, 5000)
  expect(r.remaining).toBe(0)
  expect(r.status).toBe('SETTLED')
})

test('paying a debt I owe debits the wallet; collecting credits it', () => {
  expect(walletDeltaForPayment('I_OWE', 10000, 3000)).toBe(7000)
  expect(walletDeltaForPayment('OWED_TO_ME', 10000, 3000)).toBe(13000)
})
