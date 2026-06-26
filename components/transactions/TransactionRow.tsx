'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { formatAmount } from '@/lib/currency'
import IconTile from '@/components/shared/IconTile'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import { createClient } from '@/lib/supabase/client'
import type { TransactionWithRelations } from '@/types'

function ReceiptLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.img
          src={url}
          alt="Receipt"
          className="max-w-[90vw] max-h-[85vh] rounded-[var(--radius-md)] object-contain"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  )
}

function ReceiptThumbnails({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (paths.length === 0) return
    const supabase = createClient()
    Promise.all(
      paths.map(path =>
        supabase.storage
          .from('receipts')
          .createSignedUrl(path, 3600)
          .then(({ data }) => data?.signedUrl ?? null)
      )
    ).then(results => setUrls(results.filter((u): u is string => u !== null)))
  }, [paths])

  if (urls.length === 0) return null

  return (
    <>
      <div className="flex gap-2 px-4 pb-3 flex-wrap">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Receipt ${i + 1}`}
            className="rounded-[var(--radius-md)] w-16 h-16 object-cover cursor-pointer"
            onClick={e => { e.stopPropagation(); setLightboxUrl(url) }}
          />
        ))}
      </div>
      {lightboxUrl && (
        <ReceiptLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  )
}

export function TransactionRow({
  tx,
  onClick,
}: {
  tx: TransactionWithRelations
  onClick?: (tx: TransactionWithRelations) => void
}) {
  const isIncome = tx.type === 'INCOME'
  const hasPhotos = tx.photos && tx.photos.length > 0

  return (
    <div>
      <motion.div
        className="flex items-center justify-between py-3 px-4 cursor-pointer"
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => onClick?.(tx)}
      >
        <div className="flex items-center gap-3">
          <IconTile
            icon={getCategoryIcon(tx.category.icon)}
            color={tx.category.color}
            size={40}
          />
          <div>
            <p className="text-sm font-medium text-text-primary">{tx.category.name}</p>
            <p className="text-xs text-text-secondary">{tx.note || tx.wallet.name}</p>
          </div>
        </div>
        <p
          className={`font-semibold tabular-nums text-sm ${
            isIncome ? 'text-success' : 'text-text-primary'
          }`}
        >
          {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
        </p>
      </motion.div>
      {hasPhotos && <ReceiptThumbnails paths={tx.photos} />}
    </div>
  )
}
