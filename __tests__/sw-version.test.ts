import { isNewerVersion } from '@/lib/sw-version'

test('detects a newer semver', () => {
  expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true)
})

test('same version is not newer', () => {
  expect(isNewerVersion('2.3.0', '2.3.0')).toBe(false)
})

test('older incoming is not newer', () => {
  expect(isNewerVersion('2.0.0', '1.9.9')).toBe(false)
})
