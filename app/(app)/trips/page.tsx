'use client'
import { useEffect, useState } from 'react'
import { Plus, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Trip } from '@/types'

export const dynamic = 'force-dynamic'

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    fetch('/api/trips').then(r => r.json()).then(setTrips)
  }, [])

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Button size="sm"><Plus size={16} className="mr-2" /> New Trip</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trips.map(trip => (
          <Link key={trip.id} href={`/trips/${trip.id}`}>
            <div className="p-4 rounded-xl bg-surface border border-white/10 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plane size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{trip.name}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(trip.startDate), 'MMM d')}
                    {trip.endDate ? ` — ${format(new Date(trip.endDate), 'MMM d, yyyy')}` : ' — ongoing'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400">{trip.baseCurrency}</p>
            </div>
          </Link>
        ))}
        {trips.length === 0 && (
          <p className="col-span-2 text-slate-400 text-center py-12">No trips yet.</p>
        )}
      </div>
    </div>
  )
}
