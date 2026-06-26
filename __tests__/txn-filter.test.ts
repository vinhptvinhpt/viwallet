import { buildTransactionWhere } from '@/lib/txn-filter'

test('builds amount range and category-in filter', () => {
  const w = buildTransactionWhere('u1', { minAmount: '1000', maxAmount: '5000', categoryIds: 'a,b' })
  expect(w.userId).toBe('u1')
  expect(w.convertedAmount).toEqual({ gte: 1000, lte: 5000 })
  expect(w.categoryId).toEqual({ in: ['a', 'b'] })
})

test('text query searches note case-insensitively', () => {
  const w = buildTransactionWhere('u1', { q: 'coffee' })
  expect(w.note).toEqual({ contains: 'coffee', mode: 'insensitive' })
})

test('empty query yields only the user scope', () => {
  const w = buildTransactionWhere('u1', {})
  expect(w).toEqual({ userId: 'u1' })
})
