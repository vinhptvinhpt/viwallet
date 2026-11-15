import { computeMemberBalances, ExpenseItem, SettlementItem } from '@/lib/split/balances'

describe('computeMemberBalances', () => {
  const members = ['alice', 'bob', 'charlie']

  it('computes net balances correctly for a single expense', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        paidByMemberId: 'alice',
        amount: 6000,
        shares: [
          { memberId: 'alice', shareAmount: 2000 },
          { memberId: 'bob', shareAmount: 2000 },
          { memberId: 'charlie', shareAmount: 2000 },
        ],
      },
    ]

    const balances = computeMemberBalances(members, expenses, [])

    expect(balances['alice']).toEqual({
      memberId: 'alice',
      paid: 6000,
      owed: 2000,
      net: 4000,
    })
    expect(balances['bob']).toEqual({
      memberId: 'bob',
      paid: 0,
      owed: 2000,
      net: -2000,
    })
    expect(balances['charlie']).toEqual({
      memberId: 'charlie',
      paid: 0,
      owed: 2000,
      net: -2000,
    })

    // Invariant: sum of net balances is zero
    const totalNet = Object.values(balances).reduce((sum, b) => sum + b.net, 0)
    expect(totalNet).toBe(0)
  })

  it('ignores soft-deleted expenses', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        paidByMemberId: 'alice',
        amount: 6000,
        deletedAt: new Date(),
        shares: [
          { memberId: 'alice', shareAmount: 2000 },
          { memberId: 'bob', shareAmount: 2000 },
          { memberId: 'charlie', shareAmount: 2000 },
        ],
      },
    ]

    const balances = computeMemberBalances(members, expenses, [])

    expect(balances['alice'].net).toBe(0)
    expect(balances['bob'].net).toBe(0)
    expect(balances['charlie'].net).toBe(0)
  })

  it('updates balances when settlements are recorded', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        paidByMemberId: 'alice',
        amount: 6000,
        shares: [
          { memberId: 'alice', shareAmount: 2000 },
          { memberId: 'bob', shareAmount: 2000 },
          { memberId: 'charlie', shareAmount: 2000 },
        ],
      },
    ]

    const settlements: SettlementItem[] = [
      {
        id: 's1',
        payerMemberId: 'bob',
        payeeMemberId: 'alice',
        amount: 2000,
      },
    ]

    const balances = computeMemberBalances(members, expenses, settlements)

    expect(balances['bob'].net).toBe(0) // bob settled his debt
    expect(balances['alice'].net).toBe(2000) // alice is now owed 2000 (from charlie)
    expect(balances['charlie'].net).toBe(-2000)
  })
})
