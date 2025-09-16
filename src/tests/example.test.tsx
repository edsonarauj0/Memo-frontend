import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders login page by default', async () => {
    render(<App />)
    expect(await screen.findByPlaceholderText(/Email/i)).toBeInTheDocument()
  })
})

