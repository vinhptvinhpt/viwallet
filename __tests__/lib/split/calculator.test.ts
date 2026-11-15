import { calculateSplits, SplitInput } from '@/lib/split/calculator'

describe('calculateSplits', () => {
  describe('EQUAL mode', () => {
    it('splits evenly with deterministic remainder cents assigned to sorted memberIds', () => {
      const input: SplitInput = {
        amount: 10000, // $100.00
        memberIds: ['charlie', 'alice', 'bob'],
        mode: 'EQUAL',
      }
      const result = calculateSplits(input)

      // Sorted order: alice, bob, charlie
      // 10000 / 3 = 3333 with remainder 1 cent
      // alice gets 3334, bob gets 3333, charlie gets 3333
      expect(result.shares).toEqual({
        alice: 3334,
        bob: 3333,
        charlie: 3333,
      })
      expect(result.total).toBe(10000)
      const sum = Object.values(result.shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(10000)
    })

    it('splits cleanly when there is no remainder', () => {
      const input: SplitInput = {
        amount: 9000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'EQUAL',
      }
      const result = calculateSplits(input)
      expect(result.shares).toEqual({
        m1: 3000,
        m2: 3000,
        m3: 3000,
      })
      expect(result.total).toBe(9000)
    })
  })

  describe('PERCENTAGE mode', () => {
    it('splits according to clean percentages', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'PERCENTAGE',
        values: {
          m1: 50,
          m2: 25,
          m3: 25,
        },
      }
      const result = calculateSplits(input)
      expect(result.shares).toEqual({
        m1: 5000,
        m2: 2500,
        m3: 2500,
      })
      expect(result.total).toBe(10000)
    })

    it('handles rounding discrepancy deterministically ensuring exact sum', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'PERCENTAGE',
        values: {
          m1: 33.34,
          m2: 33.33,
          m3: 33.33,
        },
      }
      const result = calculateSplits(input)
      const sum = Object.values(result.shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(10000)
    })

    it('throws when percentages do not sum to 100', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2'],
        mode: 'PERCENTAGE',
        values: { m1: 60, m2: 30 }, // 90%
      }
      expect(() => calculateSplits(input)).toThrow(/Percentages must sum to 100/)
    })
  })

  describe('SHARES mode', () => {
    it('splits proportionally to share weights', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'SHARES',
        values: {
          m1: 2,
          m2: 1,
          m3: 1,
        },
      }
      const result = calculateSplits(input)
      expect(result.shares).toEqual({
        m1: 5000,
        m2: 2500,
        m3: 2500,
      })
      expect(result.total).toBe(10000)
    })

    it('allocates remainder cents to highest fractional remainder', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'SHARES',
        values: {
          m1: 1,
          m2: 1,
          m3: 1,
        },
      }
      const result = calculateSplits(input)
      const sum = Object.values(result.shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(10000)
    })
  })

  describe('EXACT mode', () => {
    it('accepts exact amounts that sum to total', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2', 'm3'],
        mode: 'EXACT',
        values: {
          m1: 4500,
          m2: 3500,
          m3: 2000,
        },
      }
      const result = calculateSplits(input)
      expect(result.shares).toEqual({
        m1: 4500,
        m2: 3500,
        m3: 2000,
      })
      expect(result.total).toBe(10000)
    })

    it('throws when exact amounts do not match total amount', () => {
      const input: SplitInput = {
        amount: 10000,
        memberIds: ['m1', 'm2'],
        mode: 'EXACT',
        values: {
          m1: 5000,
          m2: 4000, // 9000 != 10000
        },
      }
      expect(() => calculateSplits(input)).toThrow(/Exact amounts sum \(9000\) does not match total amount \(10000\)/)
    })
  })

  describe('Validation & Edge Cases', () => {
    it('throws on non-positive total amount', () => {
      expect(() =>
        calculateSplits({
          amount: 0,
          memberIds: ['m1'],
          mode: 'EQUAL',
        })
      ).toThrow(/Amount must be a positive integer/)

      expect(() =>
        calculateSplits({
          amount: -500,
          memberIds: ['m1'],
          mode: 'EQUAL',
        })
      ).toThrow(/Amount must be a positive integer/)
    })

    it('throws on empty member list', () => {
      expect(() =>
        calculateSplits({
          amount: 1000,
          memberIds: [],
          mode: 'EQUAL',
        })
      ).toThrow(/At least one member is required/)
    })
  })
})
