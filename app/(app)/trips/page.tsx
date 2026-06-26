'use client'
import { useEffect, useState } from 'react'
import { Plus, MapPin, Plane } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/shared/EmptyState'
import Pressable from '@/components/motion/Pressable'
import IconTile from '@/components/shared/IconTile'
import type { Trip } from '@/types'

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => r.json())
      .then(data => {
        setTrips(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Trips</h1>
        <Button size="sm">
          <Plus size={16} className="mr-1.5" /> New Trip
        </Button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No trips yet"
          subtitle="Create a trip to track travel expenses in one place."
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {trips.map(trip => (
            <motion.div
              key={trip.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
              }}
            >
              <Link href={`/trips/${trip.id}`}>
                <Pressable
                  as="div"
                  className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {trip.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={trip.coverImage}
                        alt={trip.name}
                        className="w-11 h-11 rounded-[var(--radius-md)] object-cover shrink-0"
                      />
                    ) : (
                      <IconTile icon={MapPin} size={44} />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{trip.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {format(new Date(trip.startDate), 'MMM d')}
                        {trip.endDate
                          ? ` — ${format(new Date(trip.endDate), 'MMM d, yyyy')}`
                          : ' — ongoing'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    {trip.baseCurrency}
                  </p>
                </Pressable>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
