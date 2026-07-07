import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AutoFitVerse } from './AutoFitVerse'

describe('AutoFitVerse', () => {
  it('renders verse text', () => {
    render(<AutoFitVerse text="Tuhan adalah gembalaku" color="#ffffff" />)

    expect(screen.getByText('Tuhan adalah gembalaku')).toBeInTheDocument()
  })
})
