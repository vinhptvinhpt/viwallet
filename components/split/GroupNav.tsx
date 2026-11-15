'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Share2, Check, LayoutDashboard, Scale, History, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GroupNavProps {
  groupId: string
  groupName: string
  currency: string
  inviteToken: string
}

export function GroupNav({ groupId, groupName, currency, inviteToken }: GroupNavProps) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)

  function copyInviteLink() {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/split/invite/${inviteToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { href: `/split/${groupId}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/split/${groupId}/balances`, label: 'Balances & Settle', icon: Scale },
    { href: `/split/${groupId}/activity`, label: 'Activity Feed', icon: History },
  ]

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/split"
            className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              {groupName}
            </h1>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
              Group Currency: {currency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyInviteLink}
            className="gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" /> Copied link
              </>
            ) : (
              <>
                <Share2 size={14} /> Invite
              </>
            )}
          </Button>

          <Link href={`/split/${groupId}/expenses/new`}>
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <Plus size={15} /> Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-hairline">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
