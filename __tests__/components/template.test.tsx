import React from 'react'
import { render, screen } from '@testing-library/react'
import Template from '@/app/(app)/template'

describe('Template', () => {
  it('renders children immediately without motion wrapper delay', () => {
    render(
      <Template>
        <div data-testid="child-content">App Page Content</div>
      </Template>
    )
    const el = screen.getByTestId('child-content')
    expect(el).toBeInTheDocument()
    expect(el.textContent).toBe('App Page Content')
  })
})
