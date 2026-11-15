import { z } from 'zod'
import { prisma as defaultDb } from '@/lib/prisma'

export const recordSettlementSchema = z
  .object({
    groupId: z.string().min(1, 'Group ID is required'),
    payerMemberId: z.string().min(1, 'Payer member is required'),
    payeeMemberId: z.string().min(1, 'Payee member is required'),
    amount: z.number().int().positive('Settlement amount must be positive'),
    settlementDate: z.union([z.string(), z.date()]),
    note: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.payerMemberId !== data.payeeMemberId, {
    message: 'Payer and payee must be different members',
    path: ['payeeMemberId'],
  })

export type RecordSettlementInput = z.infer<typeof recordSettlementSchema>

export async function recordSettlement(
  userId: string,
  rawInput: RecordSettlementInput,
  db: any = defaultDb
) {
  const parsed = recordSettlementSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid settlement data' }
  }

  const { groupId, payerMemberId, payeeMemberId, amount, settlementDate, note } = parsed.data

  try {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    })
    if (!membership) {
      return { success: false, error: 'Unauthorized: You are not a member of this group' }
    }

    return await db.$transaction(async (tx: any) => {
      const settlement = await tx.settlement.create({
        data: {
          groupId,
          payerMemberId,
          payeeMemberId,
          amount,
          settlementDate: new Date(settlementDate),
          note: note || null,
          recordedById: userId,
        },
      })

      await tx.activityLog.create({
        data: {
          groupId,
          actorMemberId: membership.id,
          actionType: 'SETTLEMENT_RECORDED',
          entityId: settlement.id,
          detailsJson: JSON.stringify({
            payerMemberId,
            payeeMemberId,
            amount,
            note,
          }),
        },
      })

      return { success: true, settlement }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record settlement' }
  }
}
