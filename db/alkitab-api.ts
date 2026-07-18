import { getAlkitabBookName } from '../shared/alkitab-books'
import { getLocalizedBibleBooks, getTranslationConfig, type Verse } from '../shared/types'
import { isCompleteChapter } from './chapter-completeness'

const API_URL = 'https://bible.sonnylab.com/'
/** Cold SABDA scrapes often take 4–6s; keep headroom without long hangs. */
const REQUEST_TIMEOUT_MS = 12000
/** One retry only — multi-second backoff stacks badly on already-slow cold fetches. */
const MAX_RETRIES = 1
const INITIAL_RETRY_DELAY_MS = 400

const PASSAGES_QUERY =
  'query Passages($version: Version, $book: String, $chapter: Int){passages(version:$version,book:$book,chapter:$chapter){verses{verse type content}}}'

interface AlkitabVerseItem {
  verse: number
  type: string
  content: string
}

interface GraphQLResponse {
  data?: {
    passages?: {
      verses?: AlkitabVerseItem[] | null
    } | null
  } | null
  errors?: Array<{ message?: string }>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    error.name === 'AbortError' ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('alkitab api error 408') ||
    message.includes('alkitab api error 429') ||
    /alkitab api error 5\d\d/.test(message)
  )
}

async function alkitabFetch(body: Record<string, unknown>): Promise<GraphQLResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!response.ok) {
        const responseBody = await response.text()
        const error = new Error(`Alkitab API error ${response.status}: ${responseBody}`)
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          lastError = error
          await sleep(INITIAL_RETRY_DELAY_MS * 2 ** attempt)
          continue
        }
        throw error
      }

      return (await response.json()) as GraphQLResponse
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error('Alkitab API request timed out. Please try again.')
      } else if (error instanceof Error) {
        lastError = error
      } else {
        lastError = new Error('Alkitab API request failed')
      }

      if (isRetryableError(lastError) && attempt < MAX_RETRIES) {
        await sleep(INITIAL_RETRY_DELAY_MS * 2 ** attempt)
        continue
      }

      throw lastError
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError ?? new Error('Alkitab API request failed')
}

export function parseAlkitabVerses(data: unknown): Array<{ verse: number; text: string }> {
  if (!Array.isArray(data)) {
    return []
  }

  const byVerse = new Map<number, string>()

  for (const item of data) {
    const verseItem = item as Partial<AlkitabVerseItem>
    if (verseItem.type !== 'content') continue

    const verse = Number(verseItem.verse)
    const text = String(verseItem.content ?? '').trim()
    if (!Number.isInteger(verse) || verse < 1 || text.length === 0) {
      continue
    }

    // Prefer the first content row for a verse; duplicates are ignored.
    if (!byVerse.has(verse)) {
      byVerse.set(verse, text)
    }
  }

  return [...byVerse.entries()]
    .map(([verse, text]) => ({ verse, text }))
    .sort((a, b) => a.verse - b.verse)
}

export async function fetchAlkitabChapterVerses(
  version: string,
  bookName: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }>> {
  const payload = await alkitabFetch({
    query: PASSAGES_QUERY,
    variables: {
      version,
      book: bookName,
      chapter
    }
  })

  if (payload.errors?.length) {
    const message = payload.errors
      .map((error) => error.message)
      .filter(Boolean)
      .join('; ')
    throw new Error(message || 'Alkitab API returned a GraphQL error')
  }

  const verses = payload.data?.passages?.verses
  if (!verses) {
    throw new Error('Alkitab API returned an empty or invalid response')
  }

  return parseAlkitabVerses(verses)
}

export async function fetchAlkitabVerses(
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

  const bookName = getAlkitabBookName(translation.languageId, bookId)
  if (!bookName) {
    throw new Error(`No Alkitab book mapping for ${bookId}`)
  }

  const book = getLocalizedBibleBooks(translation.languageId).find((entry) => entry.id === bookId)
  const raw = await fetchAlkitabChapterVerses(translation.apiVersion, bookName, chapter)

  if (!isCompleteChapter(raw, translation.contiguousVerses)) {
    throw new Error(
      `Incomplete chapter returned for ${book?.name ?? bookId} ${chapter}. Please try again.`
    )
  }

  let filtered = raw
  if (startVerse !== undefined) {
    const end = endVerse ?? startVerse
    filtered = raw.filter((verse) => verse.verse >= startVerse && verse.verse <= end)
  }

  return filtered.map((verse) => ({
    book: bookId,
    bookName: book?.name ?? bookId,
    chapter,
    verse: verse.verse,
    text: verse.text
  }))
}
