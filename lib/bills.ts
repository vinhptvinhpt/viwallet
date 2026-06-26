export function daysUntil(date: Date, now: Date): number {
  const ms = date.getTime() - now.getTime()
  return Math.ceil(ms / 86_400_000)
}

export function isBillUpcoming(nextDueDate: Date, notifyDaysBefore: number, now: Date): boolean {
  const d = daysUntil(nextDueDate, now)
  return d >= 0 && d <= notifyDaysBefore
}
