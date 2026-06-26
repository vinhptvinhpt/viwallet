type Query = {
  q?: string; minAmount?: string; maxAmount?: string
  categoryIds?: string; walletId?: string; tripId?: string
  type?: string; from?: string; to?: string
}

export function buildTransactionWhere(userId: string, q: Query): Record<string, unknown> {
  const where: Record<string, unknown> = { userId }
  if (q.q) where.note = { contains: q.q, mode: 'insensitive' }
  if (q.minAmount || q.maxAmount) {
    const range: Record<string, number> = {}
    if (q.minAmount) range.gte = parseInt(q.minAmount, 10)
    if (q.maxAmount) range.lte = parseInt(q.maxAmount, 10)
    where.convertedAmount = range
  }
  if (q.categoryIds) where.categoryId = { in: q.categoryIds.split(',').filter(Boolean) }
  if (q.walletId) where.walletId = q.walletId
  if (q.tripId) where.tripId = q.tripId
  if (q.type) where.type = q.type
  if (q.from || q.to) {
    const d: Record<string, Date> = {}
    if (q.from) d.gte = new Date(q.from)
    if (q.to) d.lte = new Date(q.to)
    where.date = d
  }
  return where
}
