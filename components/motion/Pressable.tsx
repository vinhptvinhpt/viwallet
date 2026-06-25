'use client'

import { motion } from 'motion/react'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { ReactNode } from 'react'

export default function Pressable({
  as = 'div',
  children,
  className,
  onClick,
}: {
  as?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const reduced = useAppReducedMotion()
  const MotionTag = (motion as any)[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      onClick={onClick}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </MotionTag>
  )
}
