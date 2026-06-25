'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'VND', label: 'Vietnamese Dong', symbol: '₫' },
]

const WALLET_TYPES = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'BANK', label: 'Bank', icon: '🏦' },
  { value: 'EWALLET', label: 'E-Wallet', icon: '📱' },
] as const

type WalletType = 'CASH' | 'CARD' | 'BANK' | 'EWALLET'

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 fields
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [walletType, setWalletType] = useState<WalletType>('CASH')

  // Step 2 fields
  const [initialBalance, setInitialBalance] = useState('')

  async function handleSubmit() {
    setError(null)
    setSaving(true)
    try {
      const balanceCents = Math.round(parseFloat(initialBalance || '0') * 100)
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'My Wallet',
          currency,
          type: walletType,
          initialBalance: isNaN(balanceCents) ? 0 : balanceCents,
          icon: 'wallet',
          color: '#7C6FE8',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Failed to create wallet')
      }
      router.refresh()
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {/* Progress dots */}
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-surface-2'
                }`}
              />
            ))}
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {step === 1 ? 'Set up your first wallet' : 'Starting balance'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {step === 1
              ? 'Tell us about the wallet you want to track.'
              : 'Enter how much is currently in this wallet.'}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            {/* Wallet name */}
            <div className="space-y-1.5">
              <label htmlFor="wallet-name" className="text-sm font-medium text-text-primary">
                Wallet name
              </label>
              <input
                id="wallet-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Checking"
                maxLength={50}
                className="w-full bg-surface-2 rounded-[var(--radius-md)] border border-hairline px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
              />
            </div>

            {/* Currency picker */}
            <div className="space-y-1.5">
              <label htmlFor="currency" className="text-sm font-medium text-text-primary">
                Currency
              </label>
              <div className="relative">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full appearance-none bg-surface-2 rounded-[var(--radius-md)] border border-hairline px-4 py-3 pr-10 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-text-secondary"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Wallet type */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-text-primary">Type</span>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setWalletType(t.value)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${
                      walletType === t.value
                        ? 'bg-primary-soft border-primary/30 text-primary'
                        : 'bg-surface-2 border-hairline text-text-secondary hover:bg-primary-soft/50'
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none mt-2"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="flex items-center gap-3 bg-surface-2 rounded-[var(--radius-md)] px-4 py-3">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-primary-soft flex items-center justify-center text-lg">
                {WALLET_TYPES.find((t) => t.value === walletType)?.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{name.trim() || 'My Wallet'}</p>
                <p className="text-xs text-text-secondary">{currency} · {walletType}</p>
              </div>
            </div>

            {/* Initial balance */}
            <div className="space-y-1.5">
              <label htmlFor="initial-balance" className="text-sm font-medium text-text-primary">
                Current balance ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  {CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency}
                </span>
                <input
                  id="initial-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-2 rounded-[var(--radius-md)] border border-hairline pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
                />
              </div>
              <p className="text-xs text-text-secondary">Leave at 0 if you&apos;ll track from now on.</p>
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-primary text-white rounded-[var(--radius-pill)] py-3 font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-60 disabled:pointer-events-none mt-2"
            >
              {saving ? 'Creating wallet…' : 'Create wallet & start'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-text-secondary text-sm py-2 hover:text-text-primary transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
