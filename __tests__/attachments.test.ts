import { validateReceiptFiles } from '@/lib/attachments'

const file = (type: string, size: number) => ({ type, size }) as File

test('accepts up to 5 image files under 5MB', () => {
  expect(validateReceiptFiles([file('image/png', 1000)]).ok).toBe(true)
})

test('rejects non-image', () => {
  const r = validateReceiptFiles([file('application/pdf', 1000)])
  expect(r.ok).toBe(false)
})

test('rejects oversized file', () => {
  const r = validateReceiptFiles([file('image/jpeg', 6 * 1024 * 1024)])
  expect(r.ok).toBe(false)
})

test('rejects more than 5 files', () => {
  const r = validateReceiptFiles(Array(6).fill(file('image/png', 100)))
  expect(r.ok).toBe(false)
})
