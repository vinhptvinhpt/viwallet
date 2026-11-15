import { calculateSplits } from '@/lib/split/calculator'
import { computeMemberBalances } from '@/lib/split/balances'
import { simplifyDebts } from '@/lib/split/simplifier'
import { createGroup, joinGroupByInvite, getGroupByInviteToken } from '@/lib/split/group-actions'
import { createExpense, updateExpense, deleteExpense } from '@/lib/split/expense-actions'
import { recordSettlement } from '@/lib/split/settle-actions'

describe('Evensteven Vertical Slice — End-to-End Journeys & Acceptance Scenarios', () => {
  // In-memory relational ledger store to simulate full database round-trips
  function createInMemoryLedgerDb() {
    let groups: any[] = []
    let members: any[] = []
    let expenses: any[] = []
    let shares: any[] = []
    let settlements: any[] = []
    let activityLogs: any[] = []
    let users = [
      { id: 'user-alice', name: 'Alice Smith', email: 'alice@example.com' },
      { id: 'user-bob', name: 'Bob Jones', email: 'bob@example.com' },
      { id: 'user-carol', name: 'Carol White', email: 'carol@example.com' },
    ]

    const db: any = {
      $transaction: async (fn: any) => fn(db),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return users.find((u) => u.id === where.id) || null
        }),
      },
      splitGroup: {
        create: jest.fn().mockImplementation(({ data }) => {
          const group = { id: `g-${Date.now()}-${Math.random()}`, archivedAt: null, ...data }
          groups.push(group)
          return group
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const g = where.inviteToken
            ? groups.find((grp) => grp.inviteToken === where.inviteToken)
            : groups.find((grp) => grp.id === where.id)
          if (!g) return null
          return {
            ...g,
            createdBy: users.find((u) => u.id === g.createdById) || { id: g.createdById, name: 'User' },
            members: members.filter((m) => m.groupId === g.id),
          }
        }),
      },
      groupMember: {
        createMany: jest.fn().mockImplementation(({ data }) => {
          const created = data.map((d: any, idx: number) => ({
            id: `m-${Date.now()}-${idx}-${Math.random()}`,
            ...d,
          }))
          members.push(...created)
          return { count: created.length }
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          return members.filter((m) => {
            if (where.groupId && m.groupId !== where.groupId) return false
            if (where.userId && m.userId !== where.userId) return false
            return true
          })
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return (
            members.find((m) => {
              if (where.groupId && m.groupId !== where.groupId) return false
              if (where.userId && m.userId !== where.userId) return false
              return true
            }) || null
          )
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return members.find((m) => m.id === where.id) || null
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = members.findIndex((m) => m.id === where.id)
          if (idx !== -1) {
            members[idx] = { ...members[idx], ...data }
            return members[idx]
          }
          return null
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const mem = { id: `m-${Date.now()}-${Math.random()}`, ...data }
          members.push(mem)
          return mem
        }),
      },
      groupExpense: {
        create: jest.fn().mockImplementation(({ data }) => {
          const { shares: initialShares, ...rest } = data
          const exp = {
            id: `exp-${Date.now()}-${Math.random()}`,
            deletedAt: null,
            ...rest,
          }
          expenses.push(exp)
          if (initialShares?.create) {
            for (const s of initialShares.create) {
              shares.push({
                id: `s-${Date.now()}-${Math.random()}`,
                expenseId: exp.id,
                ...s,
              })
            }
          }
          return exp
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return (
            expenses.find((e) => {
              if (where.id && e.id !== where.id) return false
              if (where.groupId && e.groupId !== where.groupId) return false
              if (where.deletedAt === null && e.deletedAt !== null) return false
              return true
            }) || null
          )
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const exp = expenses.find((e) => e.id === where.id)
          if (!exp) return null
          return {
            ...exp,
            shares: shares.filter((s) => s.expenseId === exp.id),
          }
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = expenses.findIndex((e) => e.id === where.id)
          if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], ...data }
            return expenses[idx]
          }
          return null
        }),
      },
      expenseShare: {
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          shares = shares.filter((s) => s.expenseId !== where.expenseId)
          return { count: 1 }
        }),
        createMany: jest.fn().mockImplementation(({ data }) => {
          const created = data.map((d: any) => ({
            id: `s-${Date.now()}-${Math.random()}`,
            ...d,
          }))
          shares.push(...created)
          return { count: created.length }
        }),
      },
      settlement: {
        create: jest.fn().mockImplementation(({ data }) => {
          const st = { id: `set-${Date.now()}-${Math.random()}`, ...data }
          settlements.push(st)
          return st
        }),
      },
      activityLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          const act = { id: `act-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...data }
          activityLogs.push(act)
          return act
        }),
      },
    }

    return {
      db,
      state: {
        get groups() {
          return groups
        },
        get members() {
          return members
        },
        get expenses() {
          return expenses
        },
        get shares() {
          return shares
        },
        get settlements() {
          return settlements
        },
        get activityLogs() {
          return activityLogs
        },
      },
    }
  }

  // ==========================================
  // ACCEPTANCE SCENARIOS
  // ==========================================

  describe('Acceptance Scenario 1: Deterministic cent split with exact remainder assignment', () => {
    it('given a 100.00 expense split three ways, shares sum to exactly 10000 cents with extra cent assigned predictably', () => {
      const totalAmount = 10000 // $100.00 in minor units
      const memberIds = ['mem-charlie', 'mem-alice', 'mem-bob']

      const result = calculateSplits({
        amount: totalAmount,
        mode: 'EQUAL',
        memberIds,
      })

      // 1. Exact sum invariant
      const sum = Object.values(result.shares).reduce((acc, v) => acc + v, 0)
      expect(sum).toBe(10000)
      expect(result.total).toBe(10000)

      // 2. Predictable remainder distribution:
      // Alphabetical order: mem-alice, mem-bob, mem-charlie
      // Remainder cent (10000 % 3 = 1) must go to mem-alice
      expect(result.shares['mem-alice']).toBe(3334)
      expect(result.shares['mem-bob']).toBe(3333)
      expect(result.shares['mem-charlie']).toBe(3333)
    })
  })

  describe('Acceptance Scenario 2: Balances reach zero after settlements match simplified debt plan', () => {
    it('given settlements recorded to match the plan, every member balance reaches zero and group shows settled up', () => {
      const memberIds = ['alice', 'bob', 'carol']

      // Alice paid 9000 for all 3 (3000 each)
      // Bob paid 3000 for all 3 (1000 each)
      const expenses = [
        {
          id: 'e1',
          paidByMemberId: 'alice',
          amount: 9000,
          deletedAt: null,
          shares: [
            { memberId: 'alice', shareAmount: 3000 },
            { memberId: 'bob', shareAmount: 3000 },
            { memberId: 'carol', shareAmount: 3000 },
          ],
        },
        {
          id: 'e2',
          paidByMemberId: 'bob',
          amount: 3000,
          deletedAt: null,
          shares: [
            { memberId: 'alice', shareAmount: 1000 },
            { memberId: 'bob', shareAmount: 1000 },
            { memberId: 'carol', shareAmount: 1000 },
          ],
        },
      ]

      // Step 1: Compute initial balances
      const initialBalances = computeMemberBalances(memberIds, expenses, [])
      expect(initialBalances['alice'].net).toBe(5000) // paid 9000, share 4000 -> +5000
      expect(initialBalances['bob'].net).toBe(-1000) // paid 3000, share 4000 -> -1000
      expect(initialBalances['carol'].net).toBe(-4000) // paid 0, share 4000 -> -4000

      // Step 2: Generate minimized settlement plan
      const plan = simplifyDebts(initialBalances)
      expect(plan.length).toBe(2)
      // Carol should pay Alice 4000, Bob should pay Alice 1000
      const totalSettledInPlan = plan.reduce((s, p) => s + p.amount, 0)
      expect(totalSettledInPlan).toBe(5000)

      // Step 3: Record settlements matching the plan
      const recordedSettlements = plan.map((p, idx) => ({
        id: `settle-${idx}`,
        payerMemberId: p.fromMemberId,
        payeeMemberId: p.toMemberId,
        amount: p.amount,
      }))

      // Step 4: Recompute balances with settlements included
      const settledBalances = computeMemberBalances(memberIds, expenses, recordedSettlements)
      expect(settledBalances['alice'].net).toBe(0)
      expect(settledBalances['bob'].net).toBe(0)
      expect(settledBalances['carol'].net).toBe(0)

      // Group is fully settled up: no further transfers needed
      const finalPlan = simplifyDebts(settledBalances)
      expect(finalPlan).toEqual([])
    })
  })

  describe('Acceptance Scenario 3: Expense deletion recomputes balances & retains audit history', () => {
    it('recomputes balances upon expense deletion, leaves activity log visible, and retains shares for audit', async () => {
      const { db, state } = createInMemoryLedgerDb()

      // 1. Create group with Alice & Bob
      const groupRes = await createGroup(
        'user-alice',
        { name: 'Roommates', currency: 'USD', initialMemberNames: ['Bob'] },
        db
      )
      expect(groupRes.success).toBe(true)
      const groupId = groupRes.group.id
      const aliceMemberId = state.members.find((m) => m.userId === 'user-alice').id
      const bobMemberId = state.members.find((m) => m.displayName === 'Bob').id

      // 2. Add an expense: Alice pays 5000 split equally
      const expRes = await createExpense(
        'user-alice',
        {
          groupId,
          description: 'Electric Bill',
          amount: 5000,
          paidByMemberId: aliceMemberId,
          splitMode: 'EQUAL',
          expenseDate: '2026-11-15',
          memberIds: [aliceMemberId, bobMemberId],
        },
        db
      )
      expect(expRes.success).toBe(true)
      const expenseId = expRes.expense.id

      // Verify active balance
      let activeExpenses = state.expenses.filter((e) => e.deletedAt === null)
      let currentBalances = computeMemberBalances(
        [aliceMemberId, bobMemberId],
        activeExpenses.map((e) => ({
          ...e,
          shares: state.shares.filter((s) => s.expenseId === e.id),
        })),
        []
      )
      expect(currentBalances[aliceMemberId].net).toBe(2500)
      expect(currentBalances[bobMemberId].net).toBe(-2500)

      // 3. Delete expense
      const delRes = await deleteExpense('user-alice', expenseId, db)
      expect(delRes.success).toBe(true)

      // 4. Verify soft-delete and balances recomputed to zero
      const deletedExpense = state.expenses.find((e) => e.id === expenseId)
      expect(deletedExpense.deletedAt).toBeInstanceOf(Date)

      activeExpenses = state.expenses.filter((e) => e.deletedAt === null)
      const recomputedBalances = computeMemberBalances(
        [aliceMemberId, bobMemberId],
        activeExpenses.map((e) => ({
          ...e,
          shares: state.shares.filter((s) => s.expenseId === e.id),
        })),
        []
      )
      expect(recomputedBalances[aliceMemberId].net).toBe(0)
      expect(recomputedBalances[bobMemberId].net).toBe(0)

      // 5. Verify activity log captures the deletion with immutable audit history
      const deleteLog = state.activityLogs.find((l) => l.actionType === 'EXPENSE_DELETED')
      expect(deleteLog).toBeDefined()
      const details = JSON.parse(deleteLog.detailsJson)
      expect(details.deletedDescription).toBe('Electric Bill')
      expect(details.deletedAmount).toBe(5000)

      // 6. Verify shares remain intact in the database (never orphaned or cascade-corrupted)
      const auditShares = state.shares.filter((s) => s.expenseId === expenseId)
      expect(auditShares.length).toBe(2)
      expect(auditShares.reduce((s, sh) => s + sh.shareAmount, 0)).toBe(5000)
    })
  })

  // ==========================================
  // END-TO-END USER JOURNEYS
  // ==========================================

  describe('User Journey 1: Create group, invite link, uneven grocery split, updated balances', () => {
    it('allows a member to create a group, invite via link, add uneven grocery expense, and view updated balances', async () => {
      const { db, state } = createInMemoryLedgerDb()

      // Step 1: Alice creates group "Ski Trip 2026" with placeholder "Bob"
      const createRes = await createGroup(
        'user-alice',
        { name: 'Ski Trip 2026', currency: 'USD', initialMemberNames: ['Bob'] },
        db
      )
      expect(createRes.success).toBe(true)
      const group = createRes.group
      expect(group.inviteToken).toBeDefined()
      expect(group.name).toBe('Ski Trip 2026')

      // Step 2: Bob resolves invite link and claims placeholder
      const inviteData = await getGroupByInviteToken(group.inviteToken, db)
      expect(inviteData.success).toBe(true)
      expect(inviteData.group).toBeDefined()
      expect(inviteData.group!.name).toBe('Ski Trip 2026')
      expect(inviteData.group!.unclaimedMembers.length).toBe(1)
      const placeholderBob = inviteData.group!.unclaimedMembers[0]!

      const joinRes = await joinGroupByInvite('user-bob', group.inviteToken, placeholderBob.id, db)
      expect(joinRes.success).toBe(true)
      expect(joinRes.member.userId).toBe('user-bob')

      const aliceMemberId = state.members.find((m) => m.userId === 'user-alice').id
      const bobMemberId = joinRes.member.id

      // Step 3: Alice adds grocery expense ($75.50 = 7550 cents) split unevenly using EXACT mode
      // Alice pays 7550: Alice consumes 4550, Bob consumes 3000
      const expRes = await createExpense(
        'user-alice',
        {
          groupId: group.id,
          description: 'Costco Groceries',
          amount: 7550,
          paidByMemberId: aliceMemberId,
          splitMode: 'EXACT',
          expenseDate: '2026-11-15',
          memberIds: [aliceMemberId, bobMemberId],
          splitValues: {
            [aliceMemberId]: 4550,
            [bobMemberId]: 3000,
          },
        },
        db
      )
      expect(expRes.success).toBe(true)

      // Step 4: Ledger balance computation
      const memberIds = [aliceMemberId, bobMemberId]
      const expData = state.expenses
        .filter((e) => e.deletedAt === null)
        .map((e) => ({
          ...e,
          shares: state.shares.filter((s) => s.expenseId === e.id),
        }))

      const balances = computeMemberBalances(memberIds, expData, [])
      expect(balances[aliceMemberId].paid).toBe(7550)
      expect(balances[aliceMemberId].owed).toBe(4550)
      expect(balances[aliceMemberId].net).toBe(3000) // Alice is owed 3000 cents ($30.00)

      expect(balances[bobMemberId].paid).toBe(0)
      expect(balances[bobMemberId].owed).toBe(3000)
      expect(balances[bobMemberId].net).toBe(-3000) // Bob owes 3000 cents ($30.00)

      // Step 5: Suggested transfer
      const transfers = simplifyDebts(balances)
      expect(transfers).toHaveLength(1)
      expect(transfers[0]).toEqual({
        fromMemberId: bobMemberId,
        toMemberId: aliceMemberId,
        amount: 3000,
      })
    })
  })

  describe('User Journey 2: Follow who-pays-whom plan, record settle payment, debt disappears', () => {
    it('allows recording a settle payment following the simplified debt plan, clearing all balances', async () => {
      const { db, state } = createInMemoryLedgerDb()

      // Setup group with Alice and Bob
      const createRes = await createGroup(
        'user-alice',
        { name: 'Roadtrip', currency: 'USD', initialMemberNames: ['Bob'] },
        db
      )
      const group = createRes.group
      const aliceMem = state.members.find((m) => m.userId === 'user-alice')
      const bobMem = state.members.find((m) => m.displayName === 'Bob')

      // Add Gas expense: Alice pays 4000 ($40.00), split equally 2000 each
      await createExpense(
        'user-alice',
        {
          groupId: group.id,
          description: 'Gas station',
          amount: 4000,
          paidByMemberId: aliceMem.id,
          splitMode: 'EQUAL',
          expenseDate: '2026-11-15',
          memberIds: [aliceMem.id, bobMem.id],
        },
        db
      )

      // Initial state: Bob owes Alice 2000 cents
      let memberIds = [aliceMem.id, bobMem.id]
      let expData = state.expenses.map((e) => ({
        ...e,
        shares: state.shares.filter((s) => s.expenseId === e.id),
      }))
      let currentBalances = computeMemberBalances(memberIds, expData, state.settlements)
      let plan = simplifyDebts(currentBalances)

      expect(plan).toEqual([
        { fromMemberId: bobMem.id, toMemberId: aliceMem.id, amount: 2000 },
      ])

      // Record Settle-up payment matching the plan: Bob pays Alice 2000
      const settleRes = await recordSettlement(
        'user-alice',
        {
          groupId: group.id,
          payerMemberId: bobMem.id,
          payeeMemberId: aliceMem.id,
          amount: 2000,
          settlementDate: '2026-11-15',
          note: 'Venmo transfer',
        },
        db
      )
      expect(settleRes.success).toBe(true)

      // Recompute balances from ledger
      const finalBalances = computeMemberBalances(memberIds, expData, state.settlements)

      expect(finalBalances[aliceMem.id].net).toBe(0)
      expect(finalBalances[bobMem.id].net).toBe(0)

      // Debt disappears completely
      const finalPlan = simplifyDebts(finalBalances)
      expect(finalPlan).toEqual([])

      // Verify activity feed records the settlement
      const settleActivity = state.activityLogs.find((a) => a.actionType === 'SETTLEMENT_RECORDED')
      expect(settleActivity).toBeDefined()
      const details = JSON.parse(settleActivity.detailsJson)
      expect(details.amount).toBe(2000)
    })
  })

  describe('User Journey 3: Correct mis-entered expense amount, activity log audit, recomputation', () => {
    it('recomputes balances when an expense amount is corrected, recording changes in the activity log', async () => {
      const { db, state } = createInMemoryLedgerDb()

      // Setup group with Alice & Bob
      const createRes = await createGroup(
        'user-alice',
        { name: 'Dinner Group', currency: 'USD', initialMemberNames: ['Bob'] },
        db
      )
      const group = createRes.group
      const aliceMem = state.members.find((m) => m.userId === 'user-alice')
      const bobMem = state.members.find((m) => m.displayName === 'Bob')

      // Step 1: Alice enters dinner as 4000 cents ($40.00) split equally (2000 each)
      const expRes = await createExpense(
        'user-alice',
        {
          groupId: group.id,
          description: 'Dinner at Bistro',
          amount: 4000,
          paidByMemberId: aliceMem.id,
          splitMode: 'EQUAL',
          expenseDate: '2026-11-15',
          memberIds: [aliceMem.id, bobMem.id],
        },
        db
      )
      expect(expRes.success).toBe(true)
      const expenseId = expRes.expense.id

      // Step 2: Alice realizes the total bill was actually 6000 cents ($60.00)
      const updateRes = await updateExpense(
        'user-alice',
        {
          expenseId,
          description: 'Dinner at Bistro (Corrected)',
          amount: 6000,
          paidByMemberId: aliceMem.id,
          splitMode: 'EQUAL',
          expenseDate: '2026-11-15',
          memberIds: [aliceMem.id, bobMem.id],
        },
        db
      )
      expect(updateRes.success).toBe(true)

      // Step 3: Activity log records the correction with before/after diff
      const updateActivity = state.activityLogs.find((a) => a.actionType === 'EXPENSE_UPDATED')
      expect(updateActivity).toBeDefined()
      const details = JSON.parse(updateActivity.detailsJson)
      expect(details.oldAmount).toBe(4000)
      expect(details.newAmount).toBe(6000)

      // Step 4: Recompute balances from ledger
      const memberIds = [aliceMem.id, bobMem.id]
      const expData = state.expenses
        .filter((e) => e.deletedAt === null)
        .map((e) => ({
          ...e,
          shares: state.shares.filter((s) => s.expenseId === e.id),
        }))

      const updatedBalances = computeMemberBalances(memberIds, expData, [])
      // Alice paid 6000, share is 3000 -> net +3000
      expect(updatedBalances[aliceMem.id].paid).toBe(6000)
      expect(updatedBalances[aliceMem.id].owed).toBe(3000)
      expect(updatedBalances[aliceMem.id].net).toBe(3000)

      // Bob owes 3000
      expect(updatedBalances[bobMem.id].owed).toBe(3000)
      expect(updatedBalances[bobMem.id].net).toBe(-3000)

      const updatedPlan = simplifyDebts(updatedBalances)
      expect(updatedPlan).toEqual([
        { fromMemberId: bobMem.id, toMemberId: aliceMem.id, amount: 3000 },
      ])
    })
  })
})
