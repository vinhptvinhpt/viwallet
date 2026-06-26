import { shouldVibrate } from '@/lib/haptics'

test('vibrates when supported and enabled', () => {
  expect(shouldVibrate(true, true)).toBe(true)
})

test('no vibrate when disabled', () => {
  expect(shouldVibrate(true, false)).toBe(false)
})

test('no vibrate when unsupported', () => {
  expect(shouldVibrate(false, true)).toBe(false)
})
