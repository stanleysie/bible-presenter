import { useCallback, useEffect, useRef, useState } from 'react'
import { AutoFitVerse } from '../shared/AutoFitVerse'
import { OutputPreview } from '../shared/OutputPreview'
import appIcon from '../shared/assets/icon.png'
import { formatDisplayReference } from '../shared/format-reference'
import { getSlideBackgroundStyle } from '../shared/slide-background'
import type {
  AppSettings,
  Book,
  DisplayInfo,
  PresentationTheme,
  Translation,
  Verse,
  VerseRange
} from '../shared/types'
import { DEFAULT_THEME } from '../shared/types'

export default function App(): JSX.Element {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [translationId, setTranslationId] = useState('tb')
  const [books, setBooks] = useState<Book[]>([])
  const [bookId, setBookId] = useState('GEN')
  const [chapters, setChapters] = useState<number[]>([])
  const [chapter, setChapter] = useState(1)
  const [verses, setVerses] = useState<Verse[]>([])
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [referenceInput, setReferenceInput] = useState('')
  const [preview, setPreview] = useState<VerseRange | null>(null)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [theme, setTheme] = useState<PresentationTheme>(DEFAULT_THEME)
  const [error, setError] = useState<string | null>(null)
  const [loadingVerses, setLoadingVerses] = useState(false)
  const [outputVisible, setOutputVisible] = useState(false)
  const pendingVerseRef = useRef<number | null>(1)
  const skipNextVerseLoadRef = useRef(false)
  const loadRequestIdRef = useRef(0)

  const currentTranslation = translations.find((t) => t.id === translationId)

  const loadVerses = useCallback(
    async (tId: string, bId: string, ch: number) => {
      const requestId = ++loadRequestIdRef.current
      setLoadingVerses(true)
      setError(null)
      try {
        const result = await window.biblePresenter.getVerses(tId, bId, ch)
        if (requestId !== loadRequestIdRef.current) return

        setVerses(result.verses)
        if (result.verses.length > 0) {
          const pending = pendingVerseRef.current
          pendingVerseRef.current = null
          if (pending !== null && result.verses.some((v) => v.verse === pending)) {
            const selected = result.verses.find((v) => v.verse === pending)!
            setSelectedVerse(selected.verse)
            setPreview({
              translationId: result.translationId,
              translationAbbreviation: result.translationAbbreviation,
              reference: `${selected.bookName} ${selected.chapter}:${selected.verse}`,
              verses: [selected]
            })
          } else {
            setSelectedVerse(null)
            setPreview(null)
          }
        } else {
          setSelectedVerse(null)
          setPreview(null)
        }
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return

        setVerses([])
        setSelectedVerse(null)
        setPreview(null)
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load verses. Check your internet connection.'
        )
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoadingVerses(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    async function init(): Promise<void> {
      const [trans, appSettings, displayList] = await Promise.all([
        window.biblePresenter.getTranslations(),
        window.biblePresenter.getSettings(),
        window.biblePresenter.getDisplays()
      ])
      setTranslations(trans)
      setSettings(appSettings)
      setTheme({ ...DEFAULT_THEME, ...appSettings.theme })
      const savedTranslationId = appSettings.defaultTranslationId
      setTranslationId(trans.some((t) => t.id === savedTranslationId) ? savedTranslationId : 'tb')
      setDisplays(displayList)
    }
    init()
  }, [])

  useEffect(() => {
    async function loadBooks(): Promise<void> {
      const bookList = await window.biblePresenter.getBooks(translationId)
      setBooks(bookList)
    }
    loadBooks()
  }, [translationId])

  useEffect(() => {
    async function loadChapters(): Promise<void> {
      const chapterList = await window.biblePresenter.getChapters(translationId, bookId)
      setChapters(chapterList)
      setChapter((current) =>
        chapterList.length > 0 && !chapterList.includes(current) ? chapterList[0] : current
      )
    }
    loadChapters()
  }, [translationId, bookId])

  useEffect(() => {
    if (skipNextVerseLoadRef.current) {
      skipNextVerseLoadRef.current = false
      return
    }
    loadVerses(translationId, bookId, chapter)
  }, [translationId, bookId, chapter, loadVerses])

  const applyVerse = useCallback(
    (verseNum: number, verseList: Verse[] = verses): void => {
      const v = verseList.find((verse) => verse.verse === verseNum)
      if (!v) return
      setSelectedVerse(v.verse)
      setPreview({
        translationId,
        translationAbbreviation: currentTranslation?.abbreviation ?? '',
        reference: `${v.bookName} ${v.chapter}:${v.verse}`,
        verses: [v]
      })
    },
    [verses, translationId, currentTranslation]
  )

  const selectVerse = (verseNum: number): void => {
    applyVerse(verseNum)
  }

  useEffect(() => {
    if (!outputVisible) return
    if (!preview) {
      void window.biblePresenter.clearOutput()
      return
    }
    void window.biblePresenter.showVerse(preview)
  }, [preview, outputVisible])

  const handleShow = (): void => {
    setOutputVisible(true)
  }

  const handleHide = async (): Promise<void> => {
    setOutputVisible(false)
    await window.biblePresenter.clearOutput()
  }

  const handleReferenceSearch = async (): Promise<void> => {
    setError(null)
    try {
      const result = await window.biblePresenter.lookupReference(translationId, referenceInput)
      if (!result) {
        setError(`Could not find "${referenceInput}". Check the reference and try again.`)
        return
      }

      const first = result.verses[0]
      const sameChapter = first.book === bookId && first.chapter === chapter

      if (sameChapter && verses.some((v) => v.verse === first.verse)) {
        applyVerse(first.verse)
        return
      }

      pendingVerseRef.current = first.verse
      if (!sameChapter) {
        skipNextVerseLoadRef.current = true
        setBookId(first.book)
        setChapter(first.chapter)
      }
      await loadVerses(translationId, first.book, first.chapter)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not look up reference. Check your internet connection.'
      )
    }
  }

  const handleClear = handleHide

  const handleDisplayChange = async (displayId: number): Promise<void> => {
    const updated = await window.biblePresenter.setOutputDisplay(displayId)
    setSettings(updated)
  }

  const handleThemeChange = async (updates: Partial<PresentationTheme>): Promise<void> => {
    const newTheme = { ...theme, ...updates }
    setTheme(newTheme)
    await window.biblePresenter.updateTheme(newTheme)
  }

  const navigateVerse = async (direction: 'prev' | 'next'): Promise<void> => {
    if (!preview || preview.verses.length === 0) return

    try {
      const current = preview.verses[0]
      const verseList =
        current.book === bookId && current.chapter === chapter && verses.length > 0
          ? verses
          : (await window.biblePresenter.getVerses(translationId, current.book, current.chapter))
              .verses

      const idx = verseList.findIndex((v) => v.verse === current.verse)
      const targetIdx = direction === 'next' ? idx + 1 : idx - 1

      if (targetIdx >= 0 && targetIdx < verseList.length) {
        applyVerse(verseList[targetIdx].verse, verseList)
        return
      }

      const chapterList = await window.biblePresenter.getChapters(translationId, current.book)
      const chapterIdx = chapterList.indexOf(current.chapter)

      if (direction === 'next' && chapterIdx < chapterList.length - 1) {
        const newChapter = chapterList[chapterIdx + 1]
        const nextChapter = await window.biblePresenter.getVerses(
          translationId,
          current.book,
          newChapter
        )
        const v = nextChapter.verses[0]
        if (!v) return

        pendingVerseRef.current = v.verse
        setChapter(newChapter)
        return
      }

      if (direction === 'prev' && chapterIdx > 0) {
        const newChapter = chapterList[chapterIdx - 1]
        const prevChapter = await window.biblePresenter.getVerses(
          translationId,
          current.book,
          newChapter
        )
        const v = prevChapter.verses[prevChapter.verses.length - 1]
        if (!v) return

        pendingVerseRef.current = v.verse
        setChapter(newChapter)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load the next verse. Check your internet connection.'
      )
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Enter' && (e.target as HTMLInputElement).id === 'reference-input') {
          handleReferenceSearch()
        }
        return
      }
      switch (e.key) {
        case 'Escape':
          handleClear()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          navigateVerse('next')
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          navigateVerse('prev')
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-icon-badge">
            <img className="header-icon" src={appIcon} alt="" aria-hidden="true" />
          </span>
          <div className="header-brand-text">
            <h1>Bible Presenter</h1>
            <p className="header-subtitle">Terjemahan Baru</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="translation-badge" aria-label="Translation">
            {currentTranslation?.abbreviation}
          </span>
        </div>
      </header>

      <div className="main">
        <aside className="sidebar sidebar-left">
          <div className="panel navigate-panel">
            <h2>Navigate</h2>
            <div className="field-row">
              <div className="field">
                <label htmlFor="book-select">Book</label>
                <select id="book-select" value={bookId} onChange={(e) => setBookId(e.target.value)}>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field-narrow">
                <label htmlFor="chapter-select">Chapter</label>
                <select
                  id="chapter-select"
                  value={chapter}
                  onChange={(e) => setChapter(Number(e.target.value))}
                >
                  {chapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field field-last field-verse-list">
              <label>Verses</label>
              <div className="verse-list">
                {loadingVerses ? (
                  <div className="verse-list-empty">Loading verses…</div>
                ) : verses.length === 0 ? (
                  <div className="verse-list-empty">
                    {error ? 'Tidak dapat memuat pasal ini.' : 'Pilih kitab dan pasal.'}
                  </div>
                ) : (
                  verses.map((v) => (
                    <button
                      key={v.verse}
                      type="button"
                      className={`verse-item ${selectedVerse === v.verse ? 'selected' : ''}`}
                      onClick={() => selectVerse(v.verse)}
                    >
                      <span className="verse-item-num">{v.verse}</span>
                      <span className="verse-item-text">
                        {v.text.slice(0, 60)}
                        {v.text.length > 60 ? '…' : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="content">
          {error && <div className="error-banner">{error}</div>}

          <div className="panel panel-compact">
            <h2>Quick Reference</h2>
            <div className="search-row">
              <input
                id="reference-input"
                type="text"
                placeholder="e.g. Yohanes 3:16"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
              />
              <button className="btn-primary" onClick={handleReferenceSearch}>
                Find
              </button>
            </div>
          </div>

          <div className="preview-panel">
            <div className="preview" style={getSlideBackgroundStyle(theme.backgroundColor)}>
              {preview ? (
                <div className="slide-content">
                  <div
                    className="preview-reference slide-reference"
                    style={{ color: theme.textColor }}
                  >
                    {formatDisplayReference(preview.reference, preview.translationAbbreviation)}
                  </div>
                  <AutoFitVerse
                    text={preview.verses[0].text}
                    color={theme.textColor}
                    verseClassName="preview-verse autofit-verse slide-verse"
                  />
                </div>
              ) : (
                <div className="preview-empty">
                  Select a verse or find a reference to preview
                </div>
              )}
            </div>
            <div className="preview-nav">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigateVerse('prev')}
                disabled={!preview || loadingVerses}
              >
                ← Previous verse
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigateVerse('next')}
                disabled={!preview || loadingVerses}
              >
                Next verse →
              </button>
            </div>
          </div>
        </main>

        <aside className="sidebar sidebar-right">
          <div className="panel output-preview-panel">
            <h2>Projector Preview</h2>
            <OutputPreview theme={theme} payload={preview} active={outputVisible} />
          </div>

          <div className="panel">
            <h2>Output Display</h2>
            <div className="field">
              <label htmlFor="output-display">Projector screen</label>
              <select
                id="output-display"
                value={settings?.outputDisplayId ?? ''}
                onChange={(e) => handleDisplayChange(Number(e.target.value))}
              >
                {displays.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} {d.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel projector-status-panel">
            <h2>On Projector</h2>
            <div className="projector-status">
              <div
                className={`projector-status-indicator ${outputVisible ? 'is-showing' : 'is-hidden'}`}
              >
                <span className="projector-status-dot" aria-hidden="true" />
                <span>{outputVisible ? 'Showing' : 'Hidden'}</span>
              </div>
              <p className="projector-status-reference">
                {preview
                  ? formatDisplayReference(preview.reference, preview.translationAbbreviation)
                  : 'No verse selected'}
              </p>
              {outputVisible ? (
                <button
                  type="button"
                  className="btn-secondary projector-status-action"
                  onClick={handleHide}
                >
                  Hide
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary projector-status-action"
                  onClick={handleShow}
                  disabled={!preview}
                >
                  Show
                </button>
              )}
            </div>
          </div>

          <div className="panel">
            <h2>Appearance</h2>
            <div className="field color-field">
              <label htmlFor="text-color">Text color</label>
              <div className="color-input-wrap">
                <input
                  id="text-color"
                  type="color"
                  className="color-input"
                  value={theme.textColor}
                  onChange={(e) => handleThemeChange({ textColor: e.target.value })}
                />
                <span className="color-value">{theme.textColor}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="shortcuts">
        <kbd>Esc</kbd> Hide &nbsp;
        <kbd>←</kbd><kbd>→</kbd> Previous / next verse
      </div>
    </div>
  )
}
