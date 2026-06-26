'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAppReducedMotion } from './useReducedMotion'

// Category palette used as confetti colors
const COLORS = [
  '#4CAF50', // success green
  '#2196F3', // blue
  '#FF9800', // orange
  '#E91E63', // pink
  '#9C27B0', // purple
  '#00BCD4', // cyan
  '#FF5722', // deep orange
  '#8BC34A', // light green
  '#FFC107', // amber
  '#3F51B5', // indigo
]

const PARTICLE_COUNT = 16

interface Particle {
  id: number
  color: string
  x: number  // final x offset in px
  y: number  // final y offset in px
  rotate: number
  scale: number
  delay: number
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 2 * Math.PI + Math.random() * 0.4
    const dist = 80 + Math.random() * 80
    return {
      id: i,
      color: COLORS[i % COLORS.length],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rotate: Math.random() * 720 - 360,
      scale: 0.4 + Math.random() * 0.6,
      delay: Math.random() * 0.1,
    }
  })
}

export default function Confetti({ fire }: { fire: boolean }) {
  const reduced = useAppReducedMotion()
  const [particles] = useState<Particle[]>(makeParticles)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!fire) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 900)
    return () => clearTimeout(t)
  }, [fire])

  if (reduced) return null

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: p.scale, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale * 0.5, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                delay: p.delay,
                ease: [0.2, 0.8, 0.4, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
