export function formatAmount(
  amount: number,
  currency: string,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

export function convertAmount(amountCents: number, exchangeRate: number): number {
  return Math.round(amountCents * exchangeRate)
}

export function parseAmountInput(value: string): number {
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''))
  return isNaN(numeric) ? 0 : Math.round(numeric * 100)
}
