import { getChapterCount, getVerses, isChapterCached, replaceChapterVerses } from './database'
import { isCompleteChapter } from './chapter-completeness'
import { fetchChapterVerses } from './verse-providers'
import { getTranslationConfig, type Verse } from '../shared/types'

const inflightChapterLoads = new Map<string, Promise<Verse[]>>()
const prefetchInflight = new Set<string>()

function chapterKey(translationId: string, bookId: string, chapter: number): string {
  return `${translationId}:${bookId}:${chapter}`
}

function hasFullChapterCache(translationId: string, verses: Verse[]): boolean {
  const translation = getTranslationConfig(translationId)
  return Boolean(translation && isCompleteChapter(verses, translation.contiguousVerses))
}

/**
 * Warm adjacent chapters in the background so next/prev navigation hits
 * SQLite (and the upstream in-memory cache) instead of a cold SABDA scrape.
 */
function scheduleAdjacentPrefetch(translationId: string, bookId: string, chapter: number): void {
  const chapterCount = getChapterCount(translationId, bookId)
  const neighbors = [chapter - 1, chapter + 1].filter(
    (value) => value >= 1 && value <= chapterCount
  )

  for (const neighbor of neighbors) {
    const key = chapterKey(translationId, bookId, neighbor)
    if (prefetchInflight.has(key)) continue
    if (isChapterCached(translationId, bookId, neighbor)) continue
    if (inflightChapterLoads.has(key)) continue

    prefetchInflight.add(key)
    void loadFullChapter(translationId, bookId, neighbor, { prefetchNeighbors: false })
      .catch(() => {
        // Prefetch is best-effort; navigation can still fetch on demand.
      })
      .finally(() => {
        prefetchInflight.delete(key)
      })
  }
}

async function loadFullChapter(
  translationId: string,
  bookId: string,
  chapter: number,
  options: { prefetchNeighbors?: boolean } = {}
): Promise<Verse[]> {
  const prefetchNeighbors = options.prefetchNeighbors !== false
  const cached = getVerses(translationId, bookId, chapter)
  if (
    isChapterCached(translationId, bookId, chapter) &&
    hasFullChapterCache(translationId, cached)
  ) {
    if (prefetchNeighbors) {
      scheduleAdjacentPrefetch(translationId, bookId, chapter)
    }
    return cached
  }

  const key = chapterKey(translationId, bookId, chapter)
  const inflight = inflightChapterLoads.get(key)
  if (inflight) {
    return inflight
  }

  const promise = (async (): Promise<Verse[]> => {
    try {
      const verses = await fetchChapterVerses(translationId, bookId, chapter)
      if (!hasFullChapterCache(translationId, verses)) {
        throw new Error(`Incomplete chapter returned for ${bookId} ${chapter}`)
      }

      replaceChapterVerses(
        translationId,
        bookId,
        chapter,
        verses.map((verse) => ({ verse: verse.verse, text: verse.text }))
      )

      if (prefetchNeighbors) {
        scheduleAdjacentPrefetch(translationId, bookId, chapter)
      }

      return verses
    } finally {
      inflightChapterLoads.delete(key)
    }
  })()

  inflightChapterLoads.set(key, promise)
  return promise
}

export async function getChapterVerses(
  translationId: string,
  bookId: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number
): Promise<Verse[]> {
  const verses = await loadFullChapter(translationId, bookId, chapter)

  if (startVerse === undefined) {
    return verses
  }

  const end = endVerse ?? startVerse
  return verses.filter((verse) => verse.verse >= startVerse && verse.verse <= end)
}

/** @internal Test helper */
export function clearVerseServiceCache(): void {
  inflightChapterLoads.clear()
  prefetchInflight.clear()
}
