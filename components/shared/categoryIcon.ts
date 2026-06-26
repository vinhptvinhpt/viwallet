import { icons, CircleDot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Convert kebab-case icon name to PascalCase, e.g. "shopping-bag" → "ShoppingBag" */
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Resolve a Lucide icon name string (as stored in Category.icon, e.g. "utensils",
 * "shopping-bag") to the corresponding LucideIcon component.
 * Falls back to CircleDot if the name is not found.
 */
export function getCategoryIcon(name: string): LucideIcon {
  const pascal = toPascalCase(name)
  const icon = (icons as Record<string, LucideIcon>)[pascal]
  return icon ?? CircleDot
}
