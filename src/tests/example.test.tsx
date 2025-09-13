import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders login page by default', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument()
  })
})
