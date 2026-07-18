import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchChapterVerses } from './verse-providers'

const fetchMayicuVerses = vi.fn()
const fetchAlkitabVerses = vi.fn()

vi.mock('./mayicu-api', () => ({
  fetchMayicuVerses: (...args: unknown[]) => fetchMayicuVerses(...args)
}))

vi.mock('./alkitab-api', () => ({
  fetchAlkitabVerses: (...args: unknown[]) => fetchAlkitabVerses(...args)
}))

const sampleVerses = [
  {
    book: 'JHN',
    bookName: 'Yohanes',
    chapter: 3,
    verse: 1,
    text: 'Ada seorang Farisi'
  }
]

describe('fetchChapterVerses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Mayicu results without calling alkitab-api', async () => {
    fetchMayicuVerses.mockResolvedValue(sampleVerses)

    const verses = await fetchChapterVerses('tb', 'JHN', 3)

    expect(verses).toEqual(sampleVerses)
    expect(fetchMayicuVerses).toHaveBeenCalledWith('tb', 'JHN', 3)
    expect(fetchAlkitabVerses).not.toHaveBeenCalled()
  })

  it('falls back to alkitab-api when Mayicu fails', async () => {
    fetchMayicuVerses.mockRejectedValue(new Error('Mayicu down'))
    fetchAlkitabVerses.mockResolvedValue(sampleVerses)

    const verses = await fetchChapterVerses('tb', 'JHN', 3)

    expect(verses).toEqual(sampleVerses)
    expect(fetchAlkitabVerses).toHaveBeenCalledWith('tb', 'JHN', 3)
  })

  it('falls back when Mayicu returns incomplete data', async () => {
    fetchMayicuVerses.mockRejectedValue(
      new Error('Incomplete chapter returned for Yohanes 3. Please try again.')
    )
    fetchAlkitabVerses.mockResolvedValue(sampleVerses)

    await expect(fetchChapterVerses('tb', 'JHN', 3)).resolves.toEqual(sampleVerses)
    expect(fetchAlkitabVerses).toHaveBeenCalled()
  })

  it('reports both provider failures when fallback also fails', async () => {
    fetchMayicuVerses.mockRejectedValue(new Error('Mayicu timeout'))
    fetchAlkitabVerses.mockRejectedValue(new Error('Alkitab scrape failed'))

    await expect(fetchChapterVerses('tb', 'JHN', 3)).rejects.toThrow(
      'Could not load JHN 3. Mayicu: Mayicu timeout; Alkitab API: Alkitab scrape failed'
    )
  })
})
