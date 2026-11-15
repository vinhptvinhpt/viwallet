export interface ExpenseItem {
  id: string
  paidByMemberId: string
  amount: number
  deletedAt?: Date | null
  shares: { memberId: string; shareAmount: number }[]
}

export interface SettlementItem {
  id: string
  payerMemberId: string
  payeeMemberId: string
  amount: number
}

export interface MemberBalance {
  memberId: string
  paid: number
  owed: number
  net: number // positive = is owed money, negative = owes money
}

export function computeMemberBalances(
  memberIds: string[],
  expenses: ExpenseItem[],
  settlements: SettlementItem[] = []
): Record<string, MemberBalance> {
  const balances: Record<string, MemberBalance> = {}

  for (const id of memberIds) {
    balances[id] = {
      memberId: id,
      paid: 0,
      owed: 0,
      net: 0,
    }
  }

  // Active expenses
  for (const expense of expenses) {
    if (expense.deletedAt) continue

    const payer = balances[expense.paidByMemberId]
    if (payer) {
      payer.paid += expense.amount
    }

    for (const share of expense.shares) {
      const debtor = balances[share.memberId]
      if (debtor) {
        debtor.owed += share.shareAmount
      }
    }
  }

  // Settlements: payer pays money -> increases payer's paid total (+amount)
  // payee receives money -> increases payee's owed total (+amount)
  for (const s of settlements) {
    const payer = balances[s.payerMemberId]
    if (payer) {
      payer.paid += s.amount
    }
    const payee = balances[s.payeeMemberId]
    if (payee) {
      payee.owed += s.amount
    }
  }

  // Net = paid - owed
  for (const id of Object.keys(balances)) {
    const b = balances[id]
    b.net = b.paid - b.owed
  }

  return balances
}
