import { SplitMode, GroupMemberRole, ActivityAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'

describe('Prisma Schema Evensteven Models Smoke Test', () => {
  it('exports SplitMode enum values correctly', () => {
    expect(SplitMode.EQUAL).toBe('EQUAL')
    expect(SplitMode.PERCENTAGE).toBe('PERCENTAGE')
    expect(SplitMode.SHARES).toBe('SHARES')
    expect(SplitMode.EXACT).toBe('EXACT')
  })

  it('exports GroupMemberRole enum values correctly', () => {
    expect(GroupMemberRole.ADMIN).toBe('ADMIN')
    expect(GroupMemberRole.MEMBER).toBe('MEMBER')
  })

  it('exports ActivityAction enum values correctly', () => {
    expect(ActivityAction.GROUP_CREATED).toBe('GROUP_CREATED')
    expect(ActivityAction.EXPENSE_CREATED).toBe('EXPENSE_CREATED')
    expect(ActivityAction.SETTLEMENT_RECORDED).toBe('SETTLEMENT_RECORDED')
  })

  it('has splitGroup delegate defined on prisma client', () => {
    expect(typeof prisma.splitGroup).toBe('object')
    expect(typeof prisma.groupMember).toBe('object')
    expect(typeof prisma.groupExpense).toBe('object')
    expect(typeof prisma.expenseShare).toBe('object')
    expect(typeof prisma.settlement).toBe('object')
    expect(typeof prisma.activityLog).toBe('object')
  })
})
