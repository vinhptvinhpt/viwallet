import {
  createGroup,
  joinGroupByInvite,
  getGroupByInviteToken,
  getGroupData,
  createGroupSchema,
} from '@/lib/split/group-actions'

describe('Group Actions & Onboarding', () => {
  describe('createGroupSchema validation', () => {
    it('validates name length and defaults currency to USD', () => {
      const valid = createGroupSchema.safeParse({ name: 'Apartment 4B' })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.name).toBe('Apartment 4B')
        expect(valid.data.currency).toBe('USD')
      }

      const invalidName = createGroupSchema.safeParse({ name: '' })
      expect(invalidName.success).toBe(false)

      const tooLongName = createGroupSchema.safeParse({ name: 'a'.repeat(61) })
      expect(tooLongName.success).toBe(false)

      const invalidCurrency = createGroupSchema.safeParse({ name: 'Roadtrip', currency: 'US' })
      expect(invalidCurrency.success).toBe(false)
    })
  })

  describe('createGroup business logic', () => {
    it('creates group, adds creator as ADMIN and adds placeholder members', async () => {
      let createdGroupData: any = null
      let createdMembersData: any = null
      let createdActivityData: any = null

      const mockDb: any = {
        $transaction: async (fn: any) => fn(mockDb),
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Alice Smith' }),
        },
        splitGroup: {
          create: jest.fn().mockImplementation(({ data }) => {
            createdGroupData = data
            return { id: 'group-1', ...data }
          }),
        },
        groupMember: {
          createMany: jest.fn().mockImplementation(({ data }) => {
            createdMembersData = data
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

      const result = await createGroup(
        'user-1',
        {
          name: 'Apartment 4B',
          currency: 'USD',
          initialMemberNames: ['Bob', 'Charlie'],
        },
        mockDb
      )

      expect(result.success).toBe(true)
      expect(createdGroupData.name).toBe('Apartment 4B')
      expect(createdGroupData.currency).toBe('USD')
      expect(createdGroupData.inviteToken).toBeDefined()

      // Creator + 2 placeholder members = 3 members
      expect(createdMembersData).toHaveLength(3)
      expect(createdMembersData[0]).toMatchObject({
        groupId: 'group-1',
        userId: 'user-1',
        displayName: 'Alice Smith',
        role: 'ADMIN',
      })
      expect(createdMembersData[1]).toMatchObject({
        groupId: 'group-1',
        userId: null,
        displayName: 'Bob',
        role: 'MEMBER',
      })
      expect(createdMembersData[2]).toMatchObject({
        groupId: 'group-1',
        userId: null,
        displayName: 'Charlie',
        role: 'MEMBER',
      })

      expect(createdActivityData.actionType).toBe('GROUP_CREATED')
    })
  })

  describe('joinGroupByInvite business logic', () => {
    it('allows a user to claim an existing placeholder member', async () => {
      const mockDb: any = {
        $transaction: async (fn: any) => fn(mockDb),
        splitGroup: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'group-1',
            inviteToken: 'valid-token',
            members: [
              { id: 'm-alice', userId: 'user-1', displayName: 'Alice' },
              { id: 'm-bob', userId: null, displayName: 'Bob' },
            ],
          }),
        },
        groupMember: {
          update: jest.fn().mockResolvedValue({
            id: 'm-bob',
            groupId: 'group-1',
            userId: 'user-2',
            displayName: 'Bob',
            role: 'MEMBER',
          }),
        },
        activityLog: {
          create: jest.fn().mockResolvedValue({ id: 'act-join' }),
        },
      }

      const result = await joinGroupByInvite(
        'user-2',
        'valid-token',
        { claimMemberId: 'm-bob' },
        mockDb
      )

      expect(result.success).toBe(true)
      expect(mockDb.groupMember.update).toHaveBeenCalledWith({
        where: { id: 'm-bob' },
        data: { userId: 'user-2' },
      })
    })

    it('rejects if the user is already a member of the group', async () => {
      const mockDb: any = {
        splitGroup: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'group-1',
            inviteToken: 'valid-token',
            members: [{ id: 'm-alice', userId: 'user-1', displayName: 'Alice' }],
          }),
        },
      }

      const result = await joinGroupByInvite('user-1', 'valid-token', {}, mockDb)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/already a member/)
    })
  })

  describe('getGroupData authorization check', () => {
    it('rejects users who are not members of the group', async () => {
      const mockDb: any = {
        splitGroup: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'group-1',
            members: [{ id: 'm-1', userId: 'user-1' }],
          }),
        },
      }

      const result = await getGroupData('group-1', 'intruder-user', mockDb)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Unauthorized/)
    })
  })
})
