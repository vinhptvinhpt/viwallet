import Link from 'next/link'
import { Wallet, Tag } from 'lucide-react'

const SETTINGS_ITEMS = [
  { href: '/settings/wallets', icon: Wallet, label: 'Wallets', desc: 'Manage your wallets and accounts' },
  { href: '/settings/categories', icon: Tag, label: 'Categories', desc: 'Customize spending categories' },
]

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="flex flex-col gap-2">
        {SETTINGS_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-white/10 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
