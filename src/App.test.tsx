import { act, render, screen, within } from '@testing-library/react'
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
  setDefaultTranslation: vi.fn(),
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
        languageId: 'id',
        apiVersion: 'tb',
        contiguousVerses: true
      },
      {
        id: 'nkjv',
        name: 'New King James Version',
        abbreviation: 'NKJV',
        locale: 'en',
        languageId: 'en',
        apiVersion: 'nkjv',
        contiguousVerses: true
      },
      {
        id: 'niv',
        name: 'New International Version',
        abbreviation: 'NIV',
        locale: 'en',
        languageId: 'en',
        apiVersion: 'niv',
        contiguousVerses: false
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
    biblePresenter.showVerse.mockResolvedValue({
      active: true,
      payload: null,
      theme: DEFAULT_THEME
    })
    biblePresenter.clearOutput.mockResolvedValue({
      active: false,
      payload: null,
      theme: DEFAULT_THEME
    })
    biblePresenter.setOutputDisplay.mockResolvedValue({
      outputDisplayId: 1,
      defaultTranslationId: 'tb',
      theme: DEFAULT_THEME
    })
    biblePresenter.setDefaultTranslation.mockImplementation(async (translationId: string) => ({
      outputDisplayId: 1,
      defaultTranslationId: translationId,
      theme: DEFAULT_THEME
    }))
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

  it('groups versions by language and persists translation changes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Navigate')

    const languageSelect = screen.getByLabelText('Language')
    const versionSelect = screen.getByLabelText('Version')

    expect(within(versionSelect).getByRole('option', { name: 'TB' })).toBeInTheDocument()
    expect(within(versionSelect).queryByRole('option', { name: 'NIV' })).not.toBeInTheDocument()

    await user.selectOptions(languageSelect, 'en')

    expect(await within(versionSelect).findByRole('option', { name: 'NKJV' })).toBeInTheDocument()
    expect(within(versionSelect).getByRole('option', { name: 'NIV' })).toBeInTheDocument()
    expect(biblePresenter.setDefaultTranslation).toHaveBeenCalledWith('nkjv')

    await user.selectOptions(versionSelect, 'niv')
    expect(biblePresenter.setDefaultTranslation).toHaveBeenCalledWith('niv')
  })

  it('selects a verse when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    const verseButton = await screen.findByRole('button', { name: /2/ })
    await user.click(verseButton)

    const preview = document.querySelector('.preview') as HTMLElement
    expect(within(preview).getByText('Kejadian 1:2 (TB)')).toBeInTheDocument()
  })

  it('loads full chapter in sidebar after quick reference search', async () => {
    const user = userEvent.setup()
    biblePresenter.getBooks.mockResolvedValue([
      { id: 'GEN', translationId: 'tb', name: 'Kejadian', order: 1 },
      { id: 'JHN', translationId: 'tb', name: 'Yohanes', order: 43 }
    ])
    biblePresenter.getChapters.mockImplementation(async (_tId: string, bId: string) =>
      bId === 'JHN' ? [1, 2, 3] : [1, 2, 3]
    )
    biblePresenter.lookupReference.mockResolvedValue({
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
    })
    biblePresenter.getVerses.mockImplementation(async (_tId: string, bId: string, ch: number) => {
      if (bId === 'JHN' && ch === 3) {
        return {
          translationId: 'tb',
          translationAbbreviation: 'TB',
          reference: 'Yohanes 3',
          verses: [1, 2, 16].map((verse) => ({
            book: 'JHN',
            bookName: 'Yohanes',
            chapter: 3,
            verse,
            text: `Verse ${verse}`
          }))
        }
      }

      return {
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
      }
    })

    render(<App />)
    await screen.findByText('Navigate')

    await user.type(screen.getByPlaceholderText('e.g. Yohanes 3:16'), 'Yohanes 3:16')
    await user.click(screen.getByRole('button', { name: 'Find' }))

    const verseList = document.querySelector('.verse-list') as HTMLElement
    await within(verseList).findByText('Verse 16')
    expect(verseList.querySelectorAll('.verse-item')).toHaveLength(3)
    expect(verseList.querySelector('.verse-item.selected')).toHaveTextContent('16')

    const preview = document.querySelector('.preview') as HTMLElement
    expect(within(preview).getByText('Yohanes 3:16 (TB)')).toBeInTheDocument()
    expect(biblePresenter.getVerses).toHaveBeenCalledWith('tb', 'JHN', 3)
  })

  it('ignores empty quick reference search', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Navigate')

    const findButton = screen.getByRole('button', { name: 'Find' })
    expect(findButton).toBeDisabled()

    const input = screen.getByPlaceholderText('e.g. Yohanes 3:16')
    await user.click(input)
    await user.keyboard('{Enter}')

    expect(biblePresenter.lookupReference).not.toHaveBeenCalled()
    expect(document.querySelector('.error-banner')).not.toBeInTheDocument()
  })

  it('clears error banner after 5 seconds', async () => {
    const user = userEvent.setup()
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    biblePresenter.lookupReference.mockResolvedValue(null)

    try {
      render(<App />)
      await screen.findByText('Navigate')

      await user.type(screen.getByPlaceholderText('e.g. Yohanes 3:16'), 'xyz')
      await user.click(screen.getByRole('button', { name: 'Find' }))

      expect(await screen.findByText(/Could not find "xyz"/)).toBeInTheDocument()

      const dismissCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 5000)
      expect(dismissCall).toBeDefined()

      act(() => {
        ;(dismissCall![0] as () => void)()
      })

      expect(document.querySelector('.error-banner')).not.toBeInTheDocument()
    } finally {
      setTimeoutSpy.mockRestore()
    }
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
