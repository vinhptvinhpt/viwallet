import { render, screen } from '@testing-library/react'
import AnimatedNumber from '@/components/motion/AnimatedNumber'

test('renders the formatted final value', () => {
  render(<AnimatedNumber value={8182.8} format={(n) => `$${n.toFixed(2)}`} />)
  expect(screen.getByText('$8182.80')).toBeInTheDocument()
})

test('renders integer value without a formatter', () => {
  render(<AnimatedNumber value={42} />)
  expect(screen.getByText('42')).toBeInTheDocument()
})
