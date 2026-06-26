'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Wallet, Tag, Download, Upload, Vibrate } from 'lucide-react'
import AppearanceCard from '@/components/theme/AppearanceCard'
import { Button } from '@/components/ui/button'
import { ImportWizard } from '@/components/data/ImportWizard'
import { hapticsEnabled, setHapticsEnabled } from '@/lib/haptics'

const SETTINGS_ITEMS = [
  { href: '/settings/wallets', icon: Wallet, label: 'Wallets', desc: 'Manage your wallets and accounts' },
  { href: '/settings/categories', icon: Tag, label: 'Categories', desc: 'Customize spending categories' },
]

async function handleExport() {
  const res = await fetch('/api/transactions/export')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'viwallet-transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const [importOpen, setImportOpen] = useState(false)
  const [hapticEnabled, setHapticEnabled] = useState(hapticsEnabled())

  function handleHapticToggle() {
    const newState = !hapticEnabled
    setHapticEnabled(newState)
    setHapticsEnabled(newState)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <AppearanceCard />
      <div className="flex flex-col gap-2 mb-4">
        {SETTINGS_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-hairline hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-xs text-text-secondary">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Data section */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-surface border border-hairline">
        <p className="font-medium mb-3">Data</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Export CSV</p>
              <p className="text-xs text-text-secondary">Download all transactions as a CSV file</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
          </div>
          <div className="flex items-center gap-4 py-2 border-t border-hairline">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Import CSV</p>
              <p className="text-xs text-text-secondary">Import transactions from a CSV file</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences section */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-surface border border-hairline">
        <p className="font-medium mb-3">Preferences</p>
        <div className="flex items-center gap-4 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Vibrate size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">Haptic feedback</p>
            <p className="text-xs text-text-secondary">Vibrate on save and delete actions</p>
          </div>
          <button
            onClick={handleHapticToggle}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
              hapticEnabled ? 'bg-primary' : 'bg-surface-2'
            }`}
            role="switch"
            aria-checked={hapticEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hapticEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
