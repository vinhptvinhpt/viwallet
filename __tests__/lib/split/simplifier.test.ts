import { simplifyDebts } from '@/lib/split/simplifier'
import { MemberBalance } from '@/lib/split/balances'

describe('simplifyDebts', () => {
  it('returns empty transfers if all balances are zero', () => {
    const balances: Record<string, MemberBalance> = {
      alice: { memberId: 'alice', paid: 1000, owed: 1000, net: 0 },
      bob: { memberId: 'bob', paid: 1000, owed: 1000, net: 0 },
    }
    expect(simplifyDebts(balances)).toEqual([])
  })

  it('simplifies a direct debt between 2 people', () => {
    const balances: Record<string, MemberBalance> = {
      alice: { memberId: 'alice', paid: 2000, owed: 1000, net: 1000 },
      bob: { memberId: 'bob', paid: 0, owed: 1000, net: -1000 },
    }
    const transfers = simplifyDebts(balances)
    expect(transfers).toEqual([
      {
        fromMemberId: 'bob',
        toMemberId: 'alice',
        amount: 1000,
      },
    ])
  })

  it('simplifies multiple debts to the minimum number of transfers (at most M - 1)', () => {
    // Charlie owes 4000, Bob owes 2000, Alice is owed 6000
    const balances: Record<string, MemberBalance> = {
      alice: { memberId: 'alice', paid: 9000, owed: 3000, net: 6000 },
      bob: { memberId: 'bob', paid: 1000, owed: 3000, net: -2000 },
      charlie: { memberId: 'charlie', paid: 0, owed: 4000, net: -4000 },
    }
    const transfers = simplifyDebts(balances)

    // Should match largest debtor (charlie: 4000) with alice (6000), then bob (2000) with alice (2000)
    expect(transfers).toHaveLength(2)
    expect(transfers).toEqual(
      expect.arrayContaining([
        { fromMemberId: 'charlie', toMemberId: 'alice', amount: 4000 },
        { fromMemberId: 'bob', toMemberId: 'alice', amount: 2000 },
      ])
    )

    // Verify all balances zero out after applying transfers
    const remaining = { alice: 6000, bob: -2000, charlie: -4000 }
    for (const t of transfers) {
      remaining[t.fromMemberId as keyof typeof remaining] += t.amount
      remaining[t.toMemberId as keyof typeof remaining] -= t.amount
    }
    expect(remaining.alice).toBe(0)
    expect(remaining.bob).toBe(0)
    expect(remaining.charlie).toBe(0)
  })

  it('handles multi-creditor and multi-debtor group', () => {
    const balances: Record<string, MemberBalance> = {
      d1: { memberId: 'd1', paid: 0, owed: 3000, net: -3000 },
      d2: { memberId: 'd2', paid: 0, owed: 2000, net: -2000 },
      c1: { memberId: 'c1', paid: 4000, owed: 0, net: 4000 },
      c2: { memberId: 'c2', paid: 1000, owed: 0, net: 1000 },
    }
    const transfers = simplifyDebts(balances)

    // 4 members -> at most 3 transfers
    expect(transfers.length).toBeLessThanOrEqual(3)

    const remaining = { d1: -3000, d2: -2000, c1: 4000, c2: 1000 }
    for (const t of transfers) {
      remaining[t.fromMemberId as keyof typeof remaining] += t.amount
      remaining[t.toMemberId as keyof typeof remaining] -= t.amount
    }
    expect(remaining.d1).toBe(0)
    expect(remaining.d2).toBe(0)
    expect(remaining.c1).toBe(0)
    expect(remaining.c2).toBe(0)
  })
})
