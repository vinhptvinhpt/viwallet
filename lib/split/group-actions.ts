import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma as defaultDb } from '@/lib/prisma'
import { computeMemberBalances } from './balances'
import { simplifyDebts } from './simplifier'

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(60, 'Group name cannot exceed 60 characters'),
  currency: z.string().trim().toUpperCase().length(3, 'Currency must be 3 characters').default('USD'),
  initialMemberNames: z.array(z.string().trim().min(1).max(50)).optional(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>

export async function createGroup(
  userId: string,
  rawInput: CreateGroupInput,
  db: any = defaultDb
) {
  const parsed = createGroupSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid group details' }
  }

  const { name, currency, initialMemberNames = [] } = parsed.data

  try {
    return await db.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const inviteToken = randomUUID()
      const group = await tx.splitGroup.create({
        data: {
          name,
          currency,
          inviteToken,
          createdById: userId,
        },
      })

      // Prepare member records: creator as ADMIN, plus placeholder members as MEMBER
      const membersToCreate: any[] = [
        {
          groupId: group.id,
          userId: user.id,
          displayName: user.name || user.email.split('@')[0],
          role: 'ADMIN',
        },
      ]

      for (const rawName of initialMemberNames) {
        const trimmed = rawName.trim()
        if (trimmed && trimmed.toLowerCase() !== (user.name || '').toLowerCase()) {
          membersToCreate.push({
            groupId: group.id,
            userId: null,
            displayName: trimmed,
            role: 'MEMBER',
          })
        }
      }

      await tx.groupMember.createMany({
        data: membersToCreate,
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          groupId: group.id,
          actionType: 'GROUP_CREATED',
          entityId: group.id,
          detailsJson: JSON.stringify({
            groupName: group.name,
            currency: group.currency,
            creatorName: user.name || user.email,
            memberCount: membersToCreate.length,
          }),
        },
      })

      return { success: true, group }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create group' }
  }
}

export async function getGroupByInviteToken(token: string, db: any = defaultDb) {
  if (!token) return { success: false, error: 'Invite token is required' }

  try {
    const group = await db.splitGroup.findUnique({
      where: { inviteToken: token },
      include: {
        createdBy: { select: { id: true, name: true } },
        members: {
          select: {
            id: true,
            userId: true,
            displayName: true,
            role: true,
          },
        },
      },
    })

    if (!group || group.archivedAt) {
      return { success: false, error: 'Invite link is invalid or expired' }
    }

    const unclaimedMembers = group.members.filter((m: any) => m.userId === null)

    return {
      success: true,
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
        inviteToken: group.inviteToken,
        createdBy: group.createdBy,
        totalMembers: group.members.length,
        unclaimedMembers,
        members: group.members,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch invite details' }
  }
}

export async function joinGroupByInvite(
  userId: string,
  token: string,
  options: { claimMemberId?: string; newDisplayName?: string } = {},
  db: any = defaultDb
) {
  try {
    const group = await db.splitGroup.findUnique({
      where: { inviteToken: token },
      include: {
        members: true,
      },
    })

    if (!group || group.archivedAt) {
      return { success: false, error: 'Invite link is invalid or expired' }
    }

    // Check if already a member
    const existing = group.members.find((m: any) => m.userId === userId)
    if (existing) {
      return { success: false, error: 'You are already a member of this group', group }
    }

    return await db.$transaction(async (tx: any) => {
      let memberRecord: any = null

      if (options.claimMemberId) {
        // Claim placeholder member
        const placeholder = group.members.find(
          (m: any) => m.id === options.claimMemberId && m.userId === null
        )
        if (!placeholder) {
          return { success: false, error: 'Selected member is already claimed or invalid' }
        }

        memberRecord = await tx.groupMember.update({
          where: { id: options.claimMemberId },
          data: { userId },
        })
      } else {
        // Create new member
        let displayName = options.newDisplayName?.trim()
        if (!displayName) {
          const user = await tx.user.findUnique({ where: { id: userId } })
          displayName = user?.name || user?.email?.split('@')[0] || 'New Member'
        }

        memberRecord = await tx.groupMember.create({
          data: {
            groupId: group.id,
            userId,
            displayName,
            role: 'MEMBER',
          },
        })
      }

      await tx.activityLog.create({
        data: {
          groupId: group.id,
          actorMemberId: memberRecord.id,
          actionType: 'MEMBER_JOINED',
          entityId: memberRecord.id,
          detailsJson: JSON.stringify({
            displayName: memberRecord.displayName,
            claimed: Boolean(options.claimMemberId),
          }),
        },
      })

      return { success: true, group, member: memberRecord }
    })
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to join group' }
  }
}

export async function getGroupData(groupId: string, userId: string, db: any = defaultDb) {
  try {
    const group = await db.splitGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true } },
          },
        },
        expenses: {
          where: { deletedAt: null },
          include: {
            paidByMember: true,
            shares: { include: { member: true } },
          },
          orderBy: { expenseDate: 'desc' },
        },
        settlements: {
          include: {
            payerMember: true,
            payeeMember: true,
          },
          orderBy: { settlementDate: 'desc' },
        },
        activityLogs: {
          include: { actorMember: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!group || group.archivedAt) {
      return { success: false, error: 'Group not found' }
    }

    // Authorization check
    const currentMember = group.members.find((m: any) => m.userId === userId)
    if (!currentMember) {
      return { success: false, error: 'Unauthorized: You are not a member of this group' }
    }

    // Compute member balances
    const memberIds = group.members.map((m: any) => m.id)
    const balances = computeMemberBalances(memberIds, group.expenses, group.settlements)
    const suggestedTransfers = simplifyDebts(balances)

    return {
      success: true,
      group,
      currentMember,
      balances,
      suggestedTransfers,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load group' }
  }
}

export async function getUserSplitGroups(userId: string, db: any = defaultDb) {
  try {
    const memberships = await db.groupMember.findMany({
      where: { userId },
      select: {
        id: true,
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            currency: true,
            archivedAt: true,
            members: {
              select: { id: true },
            },
            expenses: {
              where: { deletedAt: null },
              select: {
                id: true,
                paidByMemberId: true,
                amount: true,
                shares: {
                  select: { memberId: true, shareAmount: true },
                },
              },
            },
            settlements: {
              select: {
                id: true,
                payerMemberId: true,
                payeeMemberId: true,
                amount: true,
              },
            },
          },
        },
      },
    })

    const groupsWithBalances = memberships
      .filter((m: any) => m.group && !m.group.archivedAt)
      .map((m: any) => {
        const group = m.group
        const memberIds = group.members.map((mem: any) => mem.id)
        const balances = computeMemberBalances(memberIds, group.expenses, group.settlements)
        const myBalance = balances[m.id]?.net ?? 0

        return {
          id: group.id,
          name: group.name,
          currency: group.currency,
          memberCount: group.members.length,
          myBalance,
          myRole: m.role,
        }
      })

    return { success: true, groups: groupsWithBalances }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load user groups' }
  }
}
