export function transferBalanceDelta(fromBalance: number, toBalance: number, amount: number, toAmount: number) {
  return { from: fromBalance - amount, to: toBalance + toAmount }
}

export function reverseTransferDelta(fromBalance: number, toBalance: number, amount: number, toAmount: number) {
  return { from: fromBalance + amount, to: toBalance - toAmount }
}
