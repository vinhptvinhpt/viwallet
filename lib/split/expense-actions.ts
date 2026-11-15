import { z } from 'zod'
import { prisma as defaultDb } from '@/lib/prisma'
import { calculateSplits, SplitMode } from './calculator'

export const createExpenseSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  description: z.string().trim().min(1, 'Description is required').max(100, 'Description cannot exceed 100 characters'),
  amount: z.number().int().positive('Amount must be greater than zero'),
  paidByMemberId: z.string().min(1, 'Payer member is required'),
  splitMode: z.enum(['EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT'] as const),
  expenseDate: z.union([z.string(), z.date()]),
  memberIds: z.array(z.string()).min(1, 'At least one member must be included in the split'),
  splitValues: z.record(z.string(), z.number()).optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

export async function createExpense(
  userId: string,
  rawInput: CreateExpenseInput,
  db: any = defaultDb
) {
  const parsed = createExpenseSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid expense data' }
  }

  const { groupId, description, amount, paidByMemberId, splitMode, expenseDate, memberIds, splitValues } = parsed.data

  try {
    // Verify user is a member of the group
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    })
    if (!membership) {
      return { success: false, error: 'Unauthorized: You are not a member of this group' }
    }

    // Compute splits
    const splitResult = calculateSplits({
      amount,
      memberIds,
      mode: splitMode as SplitMode,
      values: splitValues,
    })

    return await db.$transaction(async (tx: any) => {
      const expense = await tx.groupExpense.create({
        data: {
          groupId,
          paidByMemberId,
          amount,
          description,
          splitMode: splitMode as any,
          expenseDate: new Date(expenseDate),
          createdById: userId,
        },
      })

      const sharesData = Object.entries(splitResult.shares).map(([memberId, shareAmount]) => ({
        expenseId: expense.id,
        memberId,
        shareAmount,
        rawSplitValue: splitValues?.[memberId] !== undefined ? String(splitValues[memberId]) : null,
      }))

      await tx.expenseShare.createMany({
        data: sharesData,
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          groupId,
          actorMemberId: membership.id,
          actionType: 'EXPENSE_CREATED',
          entityId: expense.id,
          detailsJson: JSON.stringify({
            description,
            amount,
            paidByMemberId,
            splitMode,
            memberCount: memberIds.length,
          }),
        },
      })

      return { success: true, expense }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create expense' }
  }
}

export const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, 'Expense ID is required'),
  description: z.string().trim().min(1).max(100).optional(),
  amount: z.number().int().positive().optional(),
  paidByMemberId: z.string().optional(),
  splitMode: z.enum(['EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT'] as const).optional(),
  expenseDate: z.union([z.string(), z.date()]).optional(),
  memberIds: z.array(z.string()).min(1).optional(),
  splitValues: z.record(z.string(), z.number()).optional(),
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

export async function updateExpense(
  userId: string,
  rawInput: UpdateExpenseInput,
  db: any = defaultDb
) {
  const parsed = updateExpenseSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid update data' }
  }

  const { expenseId, description, amount, paidByMemberId, splitMode, expenseDate, memberIds, splitValues } = parsed.data

  try {
    const existing = await db.groupExpense.findUnique({
      where: { id: expenseId },
      include: { shares: true },
    })

    if (!existing || existing.deletedAt) {
      return { success: false, error: 'Expense not found or deleted' }
    }

    // Verify user is member of group
    const membership = await db.groupMember.findFirst({
      where: { groupId: existing.groupId, userId },
    })
    if (!membership) {
      return { success: false, error: 'Unauthorized: You are not a member of this group' }
    }

    const newAmount = amount ?? existing.amount
    const newMode = (splitMode ?? existing.splitMode) as SplitMode
    const newMemberIds = memberIds ?? existing.shares.map((s: any) => s.memberId)

    const splitResult = calculateSplits({
      amount: newAmount,
      memberIds: newMemberIds,
      mode: newMode,
      values: splitValues,
    })

    return await db.$transaction(async (tx: any) => {
      const updatedExpense = await tx.groupExpense.update({
        where: { id: expenseId },
        data: {
          description: description ?? existing.description,
          amount: newAmount,
          paidByMemberId: paidByMemberId ?? existing.paidByMemberId,
          splitMode: newMode as any,
          expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        },
      })

      // Replace shares
      await tx.expenseShare.deleteMany({
        where: { expenseId },
      })

      const sharesData = Object.entries(splitResult.shares).map(([memberId, shareAmount]) => ({
        expenseId,
        memberId,
        shareAmount,
        rawSplitValue: splitValues?.[memberId] !== undefined ? String(splitValues[memberId]) : null,
      }))

      await tx.expenseShare.createMany({
        data: sharesData,
      })

      // Record activity diff
      await tx.activityLog.create({
        data: {
          groupId: existing.groupId,
          actorMemberId: membership.id,
          actionType: 'EXPENSE_UPDATED',
          entityId: expenseId,
          detailsJson: JSON.stringify({
            oldDescription: existing.description,
            newDescription: description ?? existing.description,
            oldAmount: existing.amount,
            newAmount,
            splitMode: newMode,
          }),
        },
      })

      return { success: true, expense: updatedExpense }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update expense' }
  }
}

export async function deleteExpense(
  userId: string,
  expenseId: string,
  db: any = defaultDb
) {
  try {
    const existing = await db.groupExpense.findUnique({
      where: { id: expenseId },
    })

    if (!existing || existing.deletedAt) {
      return { success: false, error: 'Expense not found or already deleted' }
    }

    const membership = await db.groupMember.findFirst({
      where: { groupId: existing.groupId, userId },
    })
    if (!membership) {
      return { success: false, error: 'Unauthorized: You are not a member of this group' }
    }

    return await db.$transaction(async (tx: any) => {
      // Soft-delete expense (sets deletedAt timestamp)
      await tx.groupExpense.update({
        where: { id: expenseId },
        data: { deletedAt: new Date() },
      })

      // Record activity log
      await tx.activityLog.create({
        data: {
          groupId: existing.groupId,
          actorMemberId: membership.id,
          actionType: 'EXPENSE_DELETED',
          entityId: expenseId,
          detailsJson: JSON.stringify({
            deletedDescription: existing.description,
            deletedAmount: existing.amount,
          }),
        },
      })

      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete expense' }
  }
}
