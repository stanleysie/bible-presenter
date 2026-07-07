import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { DEFAULT_THEME } from '../shared/types'

vi.mock('../shared/assets/background.jpg', () => ({
  default: '/test-background.jpg'
}))

vi.mock('../shared/assets/icon.png', () => ({
  default: '/test-icon.png'
}))

const biblePresenter = {
  getTranslations: vi.fn(),
  getSettings: vi.fn(),
  getDisplays: vi.fn(),
  getBooks: vi.fn(),
  getChapters: vi.fn(),
  getVerses: vi.fn(),
  lookupReference: vi.fn(),
  showVerse: vi.fn(),
  clearOutput: vi.fn(),
  setOutputDisplay: vi.fn(),
  updateTheme: vi.fn()
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(window, 'biblePresenter', {
      configurable: true,
      value: biblePresenter
    })

    biblePresenter.getTranslations.mockResolvedValue([
      {
        id: 'tb',
        name: 'Terjemahan Baru',
        abbreviation: 'TB',
        locale: 'id',
        mayicuVersion: 'tb'
      }
    ])
    biblePresenter.getSettings.mockResolvedValue({
      outputDisplayId: 1,
      defaultTranslationId: 'tb',
      theme: DEFAULT_THEME
    })
    biblePresenter.getDisplays.mockResolvedValue([
      {
        id: 1,
        label: 'Display 1',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        isPrimary: true
      }
    ])
    biblePresenter.getBooks.mockResolvedValue([
      { id: 'GEN', translationId: 'tb', name: 'Kejadian', order: 1 }
    ])
    biblePresenter.getChapters.mockResolvedValue([1, 2, 3])
    biblePresenter.getVerses.mockResolvedValue({
      translationId: 'tb',
      translationAbbreviation: 'TB',
      reference: 'Kejadian 1',
      verses: [
        {
          book: 'GEN',
          bookName: 'Kejadian',
          chapter: 1,
          verse: 1,
          text: 'Pada mulanya Allah menciptakan langit dan bumi.'
        },
        {
          book: 'GEN',
          bookName: 'Kejadian',
          chapter: 1,
          verse: 2,
          text: 'Bumi belum berbentuk dan kosong'
        }
      ]
    })
    biblePresenter.showVerse.mockResolvedValue({ active: true, payload: null, theme: DEFAULT_THEME })
    biblePresenter.clearOutput.mockResolvedValue({ active: false, payload: null, theme: DEFAULT_THEME })
    biblePresenter.setOutputDisplay.mockResolvedValue({
      outputDisplayId: 1,
      defaultTranslationId: 'tb',
      theme: DEFAULT_THEME
    })
    biblePresenter.updateTheme.mockResolvedValue({
      outputDisplayId: 1,
      defaultTranslationId: 'tb',
      theme: DEFAULT_THEME
    })
  })

  it('loads with Kejadian 1:1 selected by default', async () => {
    render(<App />)

    expect(await screen.findByText('Navigate')).toBeInTheDocument()
    const preview = document.querySelector('.preview') as HTMLElement
    expect(within(preview).getByText('Kejadian 1:1 (TB)')).toBeInTheDocument()
    expect(
      within(preview).getByText('Pada mulanya Allah menciptakan langit dan bumi.')
    ).toBeInTheDocument()
  })

  it('selects a verse when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const verseButton = await screen.findByRole('button', { name: /2/ })
    await user.click(verseButton)

    const preview = document.querySelector('.preview') as HTMLElement
    expect(within(preview).getByText('Kejadian 1:2 (TB)')).toBeInTheDocument()
  })

  it('shows projector status and toggles show/hide', async () => {
    const user = userEvent.setup()
    render(<App />)

    const showButton = await screen.findByRole('button', { name: 'Show' })
    expect(showButton).toBeEnabled()
    const statusPanel = document.querySelector('.projector-status-panel') as HTMLElement
    expect(within(statusPanel).getByText('Kejadian 1:1 (TB)')).toBeInTheDocument()

    await user.click(showButton)

    expect(biblePresenter.showVerse).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide' }))

    expect(biblePresenter.clearOutput).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument()
  })
})
