const MAX = 5 * 1024 * 1024
export function validateReceiptFiles(files: File[]): { ok: boolean; error?: string } {
  if (files.length > 5) return { ok: false, error: 'Max 5 images' }
  for (const f of files) {
    if (!f.type.startsWith('image/')) return { ok: false, error: 'Images only' }
    if (f.size > MAX) return { ok: false, error: 'Each image must be ≤5MB' }
  }
  return { ok: true }
}
