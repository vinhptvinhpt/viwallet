import { categoryTint } from '@/components/shared/categoryTint'

test('returns tint bg and the source color as foreground for a known category', () => {
  const t = categoryTint('#F08A7C')
  expect(t.fg).toBe('#F08A7C')
  expect(t.bg).toMatch(/^rgba\(240, 138, 124/)
})

test('falls back to primary for empty input', () => {
  const t = categoryTint('')
  expect(t.fg).toBe('#7C6FE8')
})
