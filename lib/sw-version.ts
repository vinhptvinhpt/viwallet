export function isNewerVersion(current: string, incoming: string): boolean {
  const a = current.split('.').map(Number)
  const b = incoming.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((b[i] ?? 0) > (a[i] ?? 0)) return true
    if ((b[i] ?? 0) < (a[i] ?? 0)) return false
  }
  return false
}
