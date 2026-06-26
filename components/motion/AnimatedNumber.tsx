'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import { useAppReducedMotion } from './useReducedMotion'

export default function AnimatedNumber({
  value,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const reduced = useAppReducedMotion()
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduced])

  return <span className={className}>{format(display)}</span>
}
