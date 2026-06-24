/**
 * Unit tests for wallets API route handlers.
 * These test the handler logic in isolation by mocking auth and prisma.
 */

// Mock auth
jest.mock('@/lib/auth', () => ({
  getUser: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wallet: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/wallets/route'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>
const mockFindMany = prisma.wallet.findMany as jest.MockedFunction<typeof prisma.wallet.findMany>
const mockCreate = prisma.wallet.create as jest.MockedFunction<typeof prisma.wallet.create>

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: null,
  avatarUrl: null,
  baseCurrency: 'USD',
  locale: 'en-US',
  createdAt: new Date(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('GET /api/wallets returns wallets for authenticated user', async () => {
  mockGetUser.mockResolvedValue(mockUser)
  const wallets = [
    {
      id: 'w-1',
      userId: 'user-1',
      name: 'Cash',
      icon: 'wallet',
      color: '#2563EB',
      currency: 'USD',
      initialBalance: 0,
      currentBalance: 5000,
      type: 'CASH' as const,
      excludeFromTotal: false,
      archived: false,
      sortOrder: 0,
      createdAt: new Date(),
    },
  ]
  mockFindMany.mockResolvedValue(wallets)

  const response = await GET()
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data).toHaveLength(1)
  expect(data[0].name).toBe('Cash')
  expect(mockFindMany).toHaveBeenCalledWith({
    where: { userId: 'user-1', archived: false },
    orderBy: { sortOrder: 'asc' },
  })
})

test('POST /api/wallets creates a wallet with currentBalance equal to initialBalance', async () => {
  mockGetUser.mockResolvedValue(mockUser)
  const created = {
    id: 'w-2',
    userId: 'user-1',
    name: 'Savings',
    icon: 'wallet',
    color: '#2563EB',
    currency: 'USD',
    initialBalance: 10000,
    currentBalance: 10000,
    type: 'BANK' as const,
    excludeFromTotal: false,
    archived: false,
    sortOrder: 0,
    createdAt: new Date(),
  }
  mockCreate.mockResolvedValue(created)

  const request = new Request('http://localhost/api/wallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Savings', currency: 'USD', initialBalance: 10000, type: 'BANK' }),
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(201)
  expect(data.name).toBe('Savings')
  expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        initialBalance: 10000,
        currentBalance: 10000,
      }),
    })
  )
})
