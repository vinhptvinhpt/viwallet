import { render, screen } from '@testing-library/react'

function Hello() {
  return <p>hello viwallet</p>
}

test('jsdom + testing-library renders a component', () => {
  render(<Hello />)
  expect(screen.getByText('hello viwallet')).toBeInTheDocument()
})
