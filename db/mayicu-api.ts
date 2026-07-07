import { BOOK_ID_TO_MAYICU_CODE } from '../shared/mayicu-books'
import { BIBLE_BOOKS, getTranslationConfig, type Verse } from '../shared/types'

const API_BASE = 'https://mayicu.id/api/alkitab/v1'
const MAX_VERSES_PER_CHAPTER = 200
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function mayicuFetch<T>(path: string): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (response.ok) {
      return response.json() as Promise<T>
    }

    const body = await response.text()
    const isRateLimited = response.status === 429
    const canRetry = isRateLimited && attempt < MAX_RETRIES

    if (canRetry) {
      await sleep(INITIAL_RETRY_DELAY_MS * 2 ** attempt)
      continue
    }

    if (isRateLimited) {
      lastError = new Error(
        'Mayicu Alkitab API rate limit reached. Please wait a moment and try again.'
      )
      break
    }

    lastError = new Error(`Mayicu Alkitab API error ${response.status}: ${body}`)
    break
  }

  throw lastError ?? new Error('Mayicu Alkitab API request failed')
}

interface MayicuVerseItem {
  number: number
  text: string
}

function parseMayicuVerses(data: unknown): Array<{ verse: number; text: string }> {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => {
      const verse = item as MayicuVerseItem
      return {
        verse: verse.number,
        text: (verse.text ?? '').trim()
      }
    })
    .filter((v) => v.verse > 0 && v.text.length > 0)
    .sort((a, b) => a.verse - b.verse)
}

export async function fetchMayicuChapterVerses(
  version: string,
  bookCode: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }>> {
  const path = `/${version}/${bookCode}/${chapter}/1/${MAX_VERSES_PER_CHAPTER}`
  const data = await mayicuFetch<unknown>(path)
  return parseMayicuVerses(data)
}

export async function fetchMayicuVerses(
  translationId: string,
  bookId: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number
): Promise<Verse[]> {
  const translation = getTranslationConfig(translationId)
  if (!translation) {
    throw new Error(`Unknown translation: ${translationId}`)
  }

  const bookCode = BOOK_ID_TO_MAYICU_CODE[bookId]
  if (!bookCode) {
    throw new Error(`No Mayicu book code mapped for ${bookId}`)
  }

  const book = BIBLE_BOOKS.find((b) => b.id === bookId)
  const raw = await fetchMayicuChapterVerses(translation.mayicuVersion, bookCode, chapter)

  if (raw.length === 0) {
    throw new Error(`No verses returned for ${book?.name ?? bookId} ${chapter}`)
  }

  let filtered = raw
  if (startVerse !== undefined) {
    const end = endVerse ?? startVerse
    filtered = raw.filter((v) => v.verse >= startVerse && v.verse <= end)
  }

  return filtered.map((v) => ({
    book: bookId,
    bookName: book?.name ?? bookId,
    chapter,
    verse: v.verse,
    text: v.text
  }))
}
