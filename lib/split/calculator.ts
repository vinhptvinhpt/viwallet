export type SplitMode = 'EQUAL' | 'PERCENTAGE' | 'SHARES' | 'EXACT'

export interface SplitInput {
  amount: number // in cents
  memberIds: string[]
  mode: SplitMode
  values?: Record<string, number>
}

export interface SplitResult {
  shares: Record<string, number>
  total: number
}

export function calculateSplits(input: SplitInput): SplitResult {
  const { amount, memberIds, mode, values = {} } = input

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer in minor units (cents)')
  }
  if (!memberIds || memberIds.length === 0) {
    throw new Error('At least one member is required')
  }

  // Unique, sorted member IDs for deterministic remainder distribution
  const sortedMembers = Array.from(new Set(memberIds)).sort()
  const m = sortedMembers.length
  const shares: Record<string, number> = {}

  if (mode === 'EQUAL') {
    const base = Math.floor(amount / m)
    const remainder = amount % m
    sortedMembers.forEach((id, index) => {
      shares[id] = base + (index < remainder ? 1 : 0)
    })
  } else if (mode === 'PERCENTAGE') {
    let totalPct = 0
    for (const id of sortedMembers) {
      const pct = values[id] ?? 0
      if (pct < 0) throw new Error('Percentages must be non-negative')
      totalPct += pct
    }
    // Allow small floating point delta around 100
    if (Math.abs(totalPct - 100) > 0.05) {
      throw new Error(`Percentages must sum to 100 (got ${totalPct})`)
    }

    let allocated = 0
    const rawShares: { id: string; raw: number; floor: number; rem: number }[] = []

    for (const id of sortedMembers) {
      const pct = values[id] ?? 0
      const exactCents = (pct * amount) / 100
      const floorCents = Math.floor(exactCents)
      allocated += floorCents
      rawShares.push({ id, raw: exactCents, floor: floorCents, rem: exactCents - floorCents })
    }

    let remainingCents = amount - allocated
    // Sort by largest fractional remainder first, then memberId
    rawShares.sort((a, b) => b.rem - a.rem || a.id.localeCompare(b.id))
    for (const item of rawShares) {
      const extra = remainingCents > 0 ? 1 : 0
      shares[item.id] = item.floor + extra
      if (remainingCents > 0) remainingCents--
    }
  } else if (mode === 'SHARES') {
    let totalWeight = 0
    for (const id of sortedMembers) {
      const weight = values[id] ?? 1
      if (weight <= 0) throw new Error('Share weights must be greater than zero')
      totalWeight += weight
    }

    let allocated = 0
    const rawShares: { id: string; raw: number; floor: number; rem: number }[] = []

    for (const id of sortedMembers) {
      const weight = values[id] ?? 1
      const exactCents = (weight * amount) / totalWeight
      const floorCents = Math.floor(exactCents)
      allocated += floorCents
      rawShares.push({ id, raw: exactCents, floor: floorCents, rem: exactCents - floorCents })
    }

    let remainingCents = amount - allocated
    rawShares.sort((a, b) => b.rem - a.rem || a.id.localeCompare(b.id))
    for (const item of rawShares) {
      const extra = remainingCents > 0 ? 1 : 0
      shares[item.id] = item.floor + extra
      if (remainingCents > 0) remainingCents--
    }
  } else if (mode === 'EXACT') {
    let sum = 0
    for (const id of sortedMembers) {
      const val = values[id] ?? 0
      if (!Number.isInteger(val) || val < 0) {
        throw new Error('Exact share amounts must be non-negative integers')
      }
      shares[id] = val
      sum += val
    }
    if (sum !== amount) {
      throw new Error(`Exact amounts sum (${sum}) does not match total amount (${amount})`)
    }
  } else {
    throw new Error(`Unsupported split mode: ${mode}`)
  }

  return { shares, total: amount }
}
