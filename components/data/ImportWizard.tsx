'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Papa from 'papaparse'
import { X, Upload, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/ui/Skeleton'
import { parseImportRow } from '@/lib/csv'
import type { ImportRow } from '@/lib/csv'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'

const REQUIRED_FIELDS = ['date', 'type', 'amount', 'currency', 'category', 'wallet', 'note'] as const
type RequiredField = (typeof REQUIRED_FIELDS)[number]

interface ParsedRow {
  raw: Record<string, string>
  mapped?: Record<RequiredField, string>
  result?: { ok: true; value: ImportRow } | { ok: false; error: string }
}

interface ImportWizardProps {
  open: boolean
  onClose: () => void
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i + 1 === current
                ? 'bg-primary text-white'
                : i + 1 < current
                ? 'bg-primary/30 text-primary'
                : 'bg-surface-2 text-text-secondary'
            }`}
          >
            {i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-6 h-0.5 mx-1 transition-colors ${i + 1 < current ? 'bg-primary/30' : 'bg-hairline'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function ImportWizard({ open, onClose }: ImportWizardProps) {
  const [step, setStep] = useState(1)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<Record<RequiredField, string>>({} as Record<RequiredField, string>)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1)
      setCsvHeaders([])
      setCsvRows([])
      setColumnMap({} as Record<RequiredField, string>)
      setParsedRows([])
      setImporting(false)
    }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelectors))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Scroll lock
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus panel
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? []
        setCsvHeaders(headers)
        setCsvRows(results.data)
        // Auto-map headers (case-insensitive)
        const autoMap: Record<string, string> = {}
        for (const field of REQUIRED_FIELDS) {
          const match = headers.find(h => h.toLowerCase() === field.toLowerCase())
          if (match) autoMap[field] = match
        }
        setColumnMap(autoMap as Record<RequiredField, string>)
        setStep(2)
      },
    })
  }

  function handleBuildPreview() {
    const rows: ParsedRow[] = csvRows.map(raw => {
      const mapped: Record<RequiredField, string> = {} as Record<RequiredField, string>
      for (const field of REQUIRED_FIELDS) {
        const csvCol = columnMap[field]
        mapped[field] = csvCol ? (raw[csvCol] ?? '') : ''
      }
      const result = parseImportRow(mapped)
      return { raw, mapped, result }
    })
    setParsedRows(rows)
    setStep(3)
  }

  async function handleImport() {
    const validRows = parsedRows
      .filter(r => r.result?.ok)
      .map(r => (r.result as { ok: true; value: ImportRow }).value)

    setImporting(true)
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json() as { created?: number; errors?: number }
      const created = data.created ?? validRows.length
      const errors = data.errors ?? 0
      if (errors > 0) {
        toast.success(`Imported ${created} transactions`, {
          description: `${errors} row(s) skipped due to errors`,
        })
      } else {
        toast.success(`Imported ${created} transactions`)
      }
      onClose()
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedRows.filter(r => r.result?.ok).length
  const invalidCount = parsedRows.filter(r => r.result && !r.result.ok).length

  const renderStep = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-text-primary">Select a CSV file</p>
              <p className="text-xs text-text-secondary mt-1">
                Expected columns: date, type, amount, currency, category, wallet, note
              </p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              Browse file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-secondary">
              {csvRows.length} rows detected. Map your CSV columns to the required fields:
            </p>
            {REQUIRED_FIELDS.map(field => (
              <div key={field} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-text-primary capitalize flex-shrink-0">{field}</span>
                <select
                  value={columnMap[field] ?? ''}
                  onChange={e =>
                    setColumnMap(prev => ({ ...prev, [field]: e.target.value }))
                  }
                  className="flex-1 bg-surface-2 border border-hairline rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— skip —</option>
                  {csvHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
            <Button onClick={handleBuildPreview} className="w-full mt-2">
              Preview <ChevronRight size={16} />
            </Button>
          </div>
        )

      case 3: {
        return (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 size={14} /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle size={14} /> {invalidCount} invalid
                </span>
              )}
            </div>
            {parsedRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-secondary border border-hairline rounded-[var(--radius-md)]">
                <XCircle size={32} strokeWidth={1.5} />
                <p className="text-sm">No valid rows found</p>
                <p className="text-xs text-text-secondary">Check your column mapping and try again</p>
              </div>
            ) : validCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-secondary border border-hairline rounded-[var(--radius-md)]">
                <XCircle size={32} strokeWidth={1.5} />
                <p className="text-sm">No valid rows — all {invalidCount} rows have errors</p>
                <p className="text-xs text-text-secondary">Go back and correct your column mapping</p>
              </div>
            ) : null}
            {parsedRows.length > 0 && (
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline max-h-[36vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-2">
                  <tr>
                    <th className="text-left px-2 py-1.5 text-text-secondary font-medium">#</th>
                    {REQUIRED_FIELDS.map(f => (
                      <th key={f} className="text-left px-2 py-1.5 text-text-secondary font-medium capitalize">{f}</th>
                    ))}
                    <th className="text-left px-2 py-1.5 text-text-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t border-hairline ${row.result?.ok ? '' : 'bg-red-500/5'}`}
                    >
                      <td className="px-2 py-1 text-text-secondary">{i + 1}</td>
                      {REQUIRED_FIELDS.map(f => (
                        <td key={f} className="px-2 py-1 text-text-primary truncate max-w-[80px]">
                          {row.mapped?.[f] ?? ''}
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        {row.result?.ok ? (
                          <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                        ) : (
                          <span title={(row.result as { ok: false; error: string })?.error}>
                            <XCircle size={14} className="text-red-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            <div className="flex gap-2 mt-1">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={validCount === 0} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )
      }

      case 4:
        return (
          <div className="flex flex-col gap-4">
            {importing ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <div className="rounded-[var(--radius-lg)] bg-surface-2 p-4 text-sm text-text-primary border border-hairline">
                  <p className="font-medium mb-1">Ready to import</p>
                  <p className="text-xs text-text-secondary">
                    <span className="text-green-600 dark:text-green-400 font-medium">{validCount} valid rows</span>
                    {invalidCount > 0 && (
                      <> · <span className="text-red-500 font-medium">{invalidCount} invalid rows will be skipped</span></>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleImport} className="flex-1">
                    Import {validCount} transaction{validCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }, [step, csvRows, csvHeaders, columnMap, parsedRows, validCount, invalidCount, importing])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-wizard-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[var(--radius-lg)] p-5 max-h-[90vh] overflow-y-auto outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 id="import-wizard-title" className="text-base font-semibold text-text-primary">
                Import CSV
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-2 rounded-[var(--radius-md)] text-text-secondary"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <StepIndicator current={step} total={4} />

            {renderStep()}

            {/* Bottom padding for safe area */}
            <div className="pb-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
