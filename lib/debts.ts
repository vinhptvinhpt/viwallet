export function applyPayment(remaining: number, payment: number) {
  const next = Math.max(0, remaining - payment)
  return { remaining: next, status: next === 0 ? 'SETTLED' as const : 'OPEN' as const }
}

export function walletDeltaForPayment(direction: 'I_OWE' | 'OWED_TO_ME', balance: number, amount: number) {
  return direction === 'I_OWE' ? balance - amount : balance + amount
}
