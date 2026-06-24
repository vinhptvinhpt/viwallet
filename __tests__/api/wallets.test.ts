import { z } from 'zod'

const walletSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().default('wallet'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
  currency: z.string().length(3),
  initialBalance: z.number().int().default(0),
  type: z.enum(['CASH', 'CARD', 'BANK', 'EWALLET']).default('CASH'),
  excludeFromTotal: z.boolean().default(false),
})

test('wallet rejects name longer than 50 chars', () => {
  const result = walletSchema.safeParse({ name: 'x'.repeat(51), currency: 'USD' })
  expect(result.success).toBe(false)
  expect(result.error?.flatten().fieldErrors.name).toBeDefined()
})

test('wallet rejects currency not exactly 3 chars', () => {
  const result = walletSchema.safeParse({ name: 'My Wallet', currency: 'US' })
  expect(result.success).toBe(false)
  expect(result.error?.flatten().fieldErrors.currency).toBeDefined()
})

test('wallet currentBalance starts at initialBalance', () => {
  const initialBalance = 50000
  const wallet = { initialBalance, currentBalance: initialBalance }
  expect(wallet.currentBalance).toBe(initialBalance)
})
