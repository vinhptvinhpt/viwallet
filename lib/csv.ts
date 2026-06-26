import { z } from 'zod'

const HEADER = ['date', 'type', 'amount', 'currency', 'category', 'wallet', 'note'] as const

export function transactionsToCsv(rows: Record<(typeof HEADER)[number], string | number>[]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = rows.map((r) => HEADER.map((h) => esc(r[h])).join(',')).join('\n')
  return `${HEADER.join(',')}\n${body}\n`
}

export const importRowSchema = z.object({
  date: z.string().min(1),
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.string().transform((s) => Math.round(parseFloat(s) * 100)),
  currency: z.string().length(3),
  category: z.string().min(1),
  wallet: z.string().min(1),
  note: z.string().optional().default(''),
})

export type ImportRow = z.infer<typeof importRowSchema>

export function parseImportRow(raw: unknown): { ok: true; value: ImportRow } | { ok: false; error: string } {
  const r = importRowSchema.safeParse(raw)
  return r.success ? { ok: true, value: r.data } : { ok: false, error: r.error.issues[0]?.message ?? 'invalid' }
}
