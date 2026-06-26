function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function categoryTint(color: string): { bg: string; fg: string } {
  const fallback = '#7C6FE8'
  const rgb = hexToRgb(color || fallback)
  const [r, g, b] = rgb ?? hexToRgb(fallback)!
  return {
    fg: color || fallback,
    bg: `rgba(${r}, ${g}, ${b}, 0.16)`,
  }
}
