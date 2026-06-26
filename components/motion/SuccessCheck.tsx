'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Check } from 'lucide-react'
import { useAppReducedMotion } from './useReducedMotion'

export default function SuccessCheck({ show }: { show: boolean }) {
  const reduced = useAppReducedMotion()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="flex items-center justify-center w-16 h-16 rounded-full bg-success text-white mx-auto"
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Check size={28} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
