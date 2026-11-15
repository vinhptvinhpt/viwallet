import { MemberBalance } from './balances'

export interface SuggestedTransfer {
  fromMemberId: string // debtor (owes money)
  toMemberId: string   // creditor (is owed money)
  amount: number       // cents
}

/**
 * Simplifies a group of member balances into the minimum number of transfers
 * using a greedy min-flow algorithm. Guaranteed to complete in at most M - 1 transfers.
 */
export function simplifyDebts(
  balances: Record<string, MemberBalance>
): SuggestedTransfer[] {
  // Extract non-zero net balances
  const debtors: { memberId: string; amount: number }[] = []
  const creditors: { memberId: string; amount: number }[] = []

  for (const b of Object.values(balances)) {
    if (b.net < 0) {
      debtors.push({ memberId: b.memberId, amount: -b.net }) // positive debt
    } else if (b.net > 0) {
      creditors.push({ memberId: b.memberId, amount: b.net })
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const transfers: SuggestedTransfer[] = []

  let dIdx = 0
  let cIdx = 0

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]
    const creditor = creditors[cIdx]

    const transferAmount = Math.min(debtor.amount, creditor.amount)

    if (transferAmount > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: transferAmount,
      })
    }

    debtor.amount -= transferAmount
    creditor.amount -= transferAmount

    if (debtor.amount === 0) dIdx++
    if (creditor.amount === 0) cIdx++
  }

  return transfers
}
