import { BIBLE_BOOKS, BOOK_NAME_TO_ID, type Verse, type VerseRange } from '../shared/types'
import { getChapterVerses } from './verse-service'

const REFERENCE_REGEX = /^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/iu

export function normalizeReference(input: string): string {
  let normalized = input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([:\-–])\s*/g, '$1')

  // Allow glued chapter numbers, e.g. "Yohanes3:16" or "Song of Solomon1:2".
  normalized = normalized.replace(/^(.+?\p{L})(\d+)(?=:|$)/u, '$1 $2')

  return normalized
}

export function parseReference(input: string): {
  bookId: string
  chapter: number
  startVerse?: number
  endVerse?: number
} | null {
  const normalized = normalizeReference(input)
  if (!normalized) return null

  const match = normalized.match(REFERENCE_REGEX)
  if (!match) return null

  const bookKey = match[1].toLowerCase().replace(/\s+/g, ' ')
  const bookId = BOOK_NAME_TO_ID[bookKey]
  if (!bookId) return null

  const chapter = parseInt(match[2], 10)
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse

  const book = BIBLE_BOOKS.find((b) => b.id === bookId)
  if (!book || chapter < 1 || chapter > book.chapters) return null

  return { bookId, chapter, startVerse, endVerse }
}

export function formatReference(verses: Verse[]): string {
  if (verses.length === 0) return ''

  const first = verses[0]
  const last = verses[verses.length - 1]

  if (first.chapter === last.chapter) {
    if (first.verse === last.verse) {
      return `${first.bookName} ${first.chapter}:${first.verse}`
    }
    return `${first.bookName} ${first.chapter}:${first.verse}-${last.verse}`
  }

  return `${first.bookName} ${first.chapter}:${first.verse}-${last.chapter}:${last.verse}`
}

export async function lookupReference(
  translationId: string,
  translationAbbreviation: string,
  reference: string
): Promise<VerseRange | null> {
  const parsed = parseReference(reference)
  if (!parsed) return null

  const { bookId, chapter, startVerse } = parsed
  const verseToShow = startVerse ?? 1
  const verses = await getChapterVerses(translationId, bookId, chapter, verseToShow, verseToShow)

  if (verses.length === 0) return null

  return {
    translationId,
    translationAbbreviation,
    reference: formatReference(verses),
    verses
  }
}
