import { render, screen, fireEvent } from '@testing-library/react'
import PillToggle from '@/components/ui/PillToggle'

test('renders options and fires onChange on click', () => {
  const onChange = jest.fn()
  render(
    <PillToggle
      options={[{ label: 'Expense', value: 'EXPENSE' }, { label: 'Income', value: 'INCOME' }]}
      value="EXPENSE"
      onChange={onChange}
    />
  )
  fireEvent.click(screen.getByText('Income'))
  expect(onChange).toHaveBeenCalledWith('INCOME')
})
