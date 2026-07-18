import type { Verse } from '../shared/types'
import { fetchAlkitabVerses } from './alkitab-api'
import { fetchMayicuVerses } from './mayicu-api'

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Unknown error'
}

/**
 * Prefer Mayicu for speed; fall back to alkitab-api on any Mayicu failure
 * (network, timeout, empty/incomplete chapter, HTTP errors).
 */
export async function fetchChapterVerses(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<Verse[]> {
  try {
    return await fetchMayicuVerses(translationId, bookId, chapter)
  } catch (mayicuError) {
    try {
      return await fetchAlkitabVerses(translationId, bookId, chapter)
    } catch (alkitabError) {
      throw new Error(
        `Could not load ${bookId} ${chapter}. Mayicu: ${errorMessage(mayicuError)}; Alkitab API: ${errorMessage(alkitabError)}`
      )
    }
  }
}
