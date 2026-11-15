import {
  createExpense,
  updateExpense,
  deleteExpense,
  createExpenseSchema,
} from '@/lib/split/expense-actions'
import { recordSettlement, recordSettlementSchema } from '@/lib/split/settle-actions'

describe('Expense & Settlement Actions', () => {
  describe('createExpenseSchema validation', () => {
    it('validates description, positive amount, and splitMode', () => {
      const valid = createExpenseSchema.safeParse({
        groupId: 'g-1',
        description: 'Groceries',
        amount: 5000,
        paidByMemberId: 'm-1',
        splitMode: 'EQUAL',
        expenseDate: '2026-11-15',
        memberIds: ['m-1', 'm-2'],
      })
      expect(valid.success).toBe(true)

      const invalidAmount = createExpenseSchema.safeParse({
        groupId: 'g-1',
        description: 'Groceries',
        amount: 0,
        paidByMemberId: 'm-1',
        splitMode: 'EQUAL',
        expenseDate: '2026-11-15',
        memberIds: ['m-1', 'm-2'],
      })
      expect(invalidAmount.success).toBe(false)
    })
  })

  describe('recordSettlementSchema validation', () => {
    it('rejects payer == payee and non-positive amount', () => {
      const samePerson = recordSettlementSchema.safeParse({
        groupId: 'g-1',
        payerMemberId: 'm-1',
        payeeMemberId: 'm-1',
        amount: 2000,
        settlementDate: '2026-11-15',
      })
      expect(samePerson.success).toBe(false)
      expect(samePerson.error?.issues[0]?.message).toMatch(/different/)

      const zeroAmount = recordSettlementSchema.safeParse({
        groupId: 'g-1',
        payerMemberId: 'm-1',
        payeeMemberId: 'm-2',
        amount: 0,
        settlementDate: '2026-11-15',
      })
      expect(zeroAmount.success).toBe(false)
    })
  })

  describe('createExpense execution', () => {
    it('creates expense, shares, and activity log in a transaction', async () => {
      let createdExpenseData: any = null
      let createdSharesData: any = null
      let createdActivityData: any = null

      const mockDb: any = {
        $transaction: async (fn: any) => fn(mockDb),
        groupMember: {
          findFirst: jest.fn().mockResolvedValue({ id: 'm-alice', groupId: 'g-1', userId: 'user-1' }),
        },
        groupExpense: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdExpenseData = data
            return { id: 'exp-1', ...data }
          }),
        },
        expenseShare: {
          createMany: jest.fn().mockImplementation(({ data }) => {
            createdSharesData = data
            return { count: data.length }
          }),
        },
        activityLog: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdActivityData = data
            return { id: 'act-1', ...data }
          }),
        },
      }

      const result = await createExpense(
        'user-1',
        {
          groupId: 'g-1',
          description: 'Weekly Groceries',
          amount: 6000,
          paidByMemberId: 'm-alice',
          splitMode: 'EQUAL',
          expenseDate: '2026-11-15',
          memberIds: ['m-alice', 'm-bob'],
        },
        mockDb
      )

      expect(result.success).toBe(true)
      expect(createdExpenseData.amount).toBe(6000)
      expect(createdExpenseData.description).toBe('Weekly Groceries')
      expect(createdSharesData).toHaveLength(2)
      expect(createdSharesData[0].shareAmount).toBe(3000)
      expect(createdSharesData[1].shareAmount).toBe(3000)
      expect(createdActivityData.actionType).toBe('EXPENSE_CREATED')
    })
  })

  describe('deleteExpense execution (soft delete)', () => {
    it('sets deletedAt and logs deletion in activity feed without deleting shares', async () => {
      let updatedData: any = null
      let createdActivity: any = null

      const mockDb: any = {
        $transaction: async (fn: any) => fn(mockDb),
        groupMember: {
          findFirst: jest.fn().mockResolvedValue({ id: 'm-alice', groupId: 'g-1', userId: 'user-1' }),
        },
        groupExpense: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'exp-1',
            groupId: 'g-1',
            description: 'Lunch',
            amount: 2500,
            deletedAt: null,
          }),
          update: jest.fn().mockImplementation(({ where, data }) => {
            updatedData = data
            return { id: where.id, ...data }
          }),
        },
        activityLog: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdActivity = data
            return { id: 'act-del', ...data }
          }),
        },
      }

      const result = await deleteExpense('user-1', 'exp-1', mockDb)
      expect(result.success).toBe(true)
      expect(updatedData.deletedAt).toBeDefined()
      expect(createdActivity.actionType).toBe('EXPENSE_DELETED')
      expect(JSON.parse(createdActivity.detailsJson).deletedAmount).toBe(2500)
    })
  })

  describe('recordSettlement execution', () => {
    it('creates a settlement and logs activity', async () => {
      let createdSettlement: any = null
      let createdActivity: any = null

      const mockDb: any = {
        $transaction: async (fn: any) => fn(mockDb),
        groupMember: {
          findFirst: jest.fn().mockResolvedValue({ id: 'm-bob', groupId: 'g-1', userId: 'user-2' }),
        },
        settlement: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdSettlement = data
            return { id: 'set-1', ...data }
          }),
        },
        activityLog: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdActivity = data
            return { id: 'act-set', ...data }
          }),
        },
      }

      const result = await recordSettlement(
        'user-2',
        {
          groupId: 'g-1',
          payerMemberId: 'm-bob',
          payeeMemberId: 'm-alice',
          amount: 3000,
          settlementDate: '2026-11-15',
          note: 'Bank transfer',
        },
        mockDb
      )

      expect(result.success).toBe(true)
      expect(createdSettlement.amount).toBe(3000)
      expect(createdSettlement.payerMemberId).toBe('m-bob')
      expect(createdSettlement.payeeMemberId).toBe('m-alice')
      expect(createdActivity.actionType).toBe('SETTLEMENT_RECORDED')
    })
  })
})
