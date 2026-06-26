import { transactionsToCsv, parseImportRow } from '@/lib/csv'

test('serializes transactions to CSV with header', () => {
  const csv = transactionsToCsv([
    { date: '2026-06-01', type: 'EXPENSE', amount: 850, currency: 'USD', category: 'Food', wallet: 'Cash', note: 'Coffee' },
  ])
  const lines = csv.trim().split('\n')
  expect(lines[0]).toBe('date,type,amount,currency,category,wallet,note')
  expect(lines[1]).toContain('2026-06-01,EXPENSE,850,USD,Food,Cash,Coffee')
})

test('parseImportRow accepts a valid row and coerces amount to int cents', () => {
  const r = parseImportRow({ date: '2026-06-01', type: 'EXPENSE', amount: '8.50', currency: 'USD', category: 'Food', wallet: 'Cash', note: '' })
  expect(r.ok).toBe(true)
  if (r.ok) expect(r.value.amount).toBe(850)
})

test('parseImportRow rejects a bad type', () => {
  const r = parseImportRow({ date: '2026-06-01', type: 'NOPE', amount: '1', currency: 'USD', category: 'Food', wallet: 'Cash', note: '' })
  expect(r.ok).toBe(false)
})
