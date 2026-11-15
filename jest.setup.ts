import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.TextDecoder = TextDecoder as any
}

// next-themes calls window.matchMedia for system theme detection; jsdom doesn't implement it
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
