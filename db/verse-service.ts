import { getVerses, insertVerses } from './database'
import { fetchMayicuVerses } from './mayicu-api'
import type { Verse } from '../shared/types'

const inflightChapterLoads = new Map<string, Promise<Verse[]>>()

function chapterKey(translationId: string, bookId: string, chapter: number): string {
  return `${translationId}:${bookId}:${chapter}`
}

function hasFullChapterCache(verses: Verse[]): boolean {
  return verses.length > 0 && verses[0].verse === 1
}

async function loadFullChapter(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<Verse[]> {
  const cached = getVerses(translationId, bookId, chapter)
  if (hasFullChapterCache(cached)) {
    return cached
  }

  const key = chapterKey(translationId, bookId, chapter)
  const inflight = inflightChapterLoads.get(key)
  if (inflight) {
    return inflight
  }

  const promise = (async (): Promise<Verse[]> => {
    try {
      const verses = await fetchMayicuVerses(translationId, bookId, chapter)
      if (verses.length > 0) {
        insertVerses(
          translationId,
          bookId,
          chapter,
          verses.map((v) => ({ verse: v.verse, text: v.text }))
        )
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
  return verses.filter((v) => v.verse >= startVerse && v.verse <= end)
}

/** @internal Test helper */
export function clearVerseServiceCache(): void {
  inflightChapterLoads.clear()
}
