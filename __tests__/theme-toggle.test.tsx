import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import ThemeToggle from '@/components/theme/ThemeToggle'

function setup() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeToggle />
    </ThemeProvider>
  )
}

test('renders a theme toggle button with accessible label', () => {
  setup()
  expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
})

test('clicking the toggle changes the documentElement class', () => {
  setup()
  const btn = screen.getByRole('button', { name: /theme/i })
  fireEvent.click(btn)
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
