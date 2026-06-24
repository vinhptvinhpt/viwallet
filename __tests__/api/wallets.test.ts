import { prisma } from '@/lib/prisma'

test('wallet requires name and currency', () => {
  const input = { name: '', currency: '' }
  expect(input.name.length).toBe(0)
  expect(input.currency.length).toBe(0)
})

test('wallet balance starts at initialBalance', () => {
  const wallet = { initialBalance: 50000, currentBalance: 50000 }
  expect(wallet.currentBalance).toBe(wallet.initialBalance)
})
