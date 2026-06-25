'use client'

import { useReducedMotion } from 'motion/react'

export function useAppReducedMotion(): boolean {
  return useReducedMotion() ?? false
}
