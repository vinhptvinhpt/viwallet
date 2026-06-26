const KEY = 'viwallet:haptics'

export function shouldVibrate(supported: boolean, enabled: boolean): boolean {
  return supported && enabled
}

export function hapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(KEY) !== 'off'
}

export function setHapticsEnabled(on: boolean): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, on ? 'on' : 'off')
}

export function haptic(pattern: number | number[] = 10): void {
  const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator
  if (shouldVibrate(supported, hapticsEnabled())) navigator.vibrate(pattern)
}
