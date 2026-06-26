export function applyContribution(currentAmount: number, targetAmount: number, contribution: number) {
  const next = currentAmount + contribution
  return { currentAmount: next, status: next >= targetAmount ? 'COMPLETED' as const : 'ACTIVE' as const }
}
