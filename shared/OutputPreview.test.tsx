import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OutputPreview } from './OutputPreview'
import { DEFAULT_THEME } from './types'
import type { VerseRange } from './types'

vi.mock('./assets/background.jpg', () => ({
  default: '/test-background.jpg'
}))

const payload: VerseRange = {
  translationId: 'tb',
  translationAbbreviation: 'TB',
  reference: 'Yohanes 3:16',
  verses: [
    {
      book: 'JHN',
      bookName: 'Yohanes',
      chapter: 3,
      verse: 16,
      text: 'Karena begitu besar kasih Allah akan dunia ini'
    }
  ]
}

describe('OutputPreview', () => {
  it('shows only the background when hidden', () => {
    render(<OutputPreview theme={DEFAULT_THEME} payload={payload} active={false} />)

    expect(screen.getByLabelText('Projector preview')).toBeInTheDocument()
    expect(screen.queryByText('Yohanes 3:16 (TB)')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Karena begitu besar kasih Allah akan dunia ini')
    ).not.toBeInTheDocument()
  })

  it('shows reference and verse when active', () => {
    render(<OutputPreview theme={DEFAULT_THEME} payload={payload} active />)

    expect(screen.getByText('Yohanes 3:16 (TB)')).toBeInTheDocument()
    expect(
      screen.getByText('Karena begitu besar kasih Allah akan dunia ini')
    ).toBeInTheDocument()
  })

  it('renders background-only when active but no payload', () => {
    render(<OutputPreview theme={DEFAULT_THEME} payload={null} active={true} />)

    const preview = screen.getByLabelText('Projector preview')
    expect(within(preview).queryByText('Yohanes 3:16 (TB)')).not.toBeInTheDocument()
  })
})
