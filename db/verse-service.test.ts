import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearVerseServiceCache, getChapterVerses } from './verse-service'

const getVerses = vi.fn()
const isChapterCached = vi.fn()
const getChapterCount = vi.fn()
const replaceChapterVerses = vi.fn()
const fetchChapterVerses = vi.fn()

vi.mock('./database', () => ({
  getVerses: (...args: unknown[]) => getVerses(...args),
  isChapterCached: (...args: unknown[]) => isChapterCached(...args),
  getChapterCount: (...args: unknown[]) => getChapterCount(...args),
  replaceChapterVerses: (...args: unknown[]) => replaceChapterVerses(...args)
}))

vi.mock('./verse-providers', () => ({
  fetchChapterVerses: (...args: unknown[]) => fetchChapterVerses(...args)
}))

function makeVerses(bookId: string, bookName: string, chapter: number, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    book: bookId,
    bookName,
    chapter,
    verse: index + 1,
    text: `Ayat ${index + 1}`
  }))
}

describe('getChapterVerses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearVerseServiceCache()
    isChapterCached.mockReturnValue(false)
    getChapterCount.mockReturnValue(1)
  })

  it('returns cached verses without calling providers', async () => {
    const expected = 3
    isChapterCached.mockReturnValue(true)
    getVerses.mockReturnValue(makeVerses('PHM', 'Filemon', 1, expected))

    const verses = await getChapterVerses('tb', 'PHM', 1)

    expect(verses).toHaveLength(expected)
    expect(fetchChapterVerses).not.toHaveBeenCalled()
  })

  it('fetches and caches verses when not cached', async () => {
    const expected = 3
    const fetched = makeVerses('PHM', 'Filemon', 1, expected)
    getVerses.mockReturnValue([])
    fetchChapterVerses.mockResolvedValue(fetched)

    const verses = await getChapterVerses('tb', 'PHM', 1)

    expect(verses).toHaveLength(expected)
    expect(fetchChapterVerses).toHaveBeenCalledWith('tb', 'PHM', 1)
    expect(replaceChapterVerses).toHaveBeenCalledWith(
      'tb',
      'PHM',
      1,
      fetched.map((verse) => ({ verse: verse.verse, text: verse.text }))
    )
  })

  it('refetches and replaces when cache only contains a partial chapter', async () => {
    const expected = 3
    const fetched = makeVerses('JHN', 'Yohanes', 3, expected)
    getVerses.mockReturnValue([
      {
        book: 'JHN',
        bookName: 'Yohanes',
        chapter: 3,
        verse: 1,
        text: 'Partial only'
      }
    ])
    fetchChapterVerses.mockResolvedValue(fetched)

    const verses = await getChapterVerses('tb', 'JHN', 3)

    expect(verses).toHaveLength(expected)
    expect(fetchChapterVerses).toHaveBeenCalledWith('tb', 'JHN', 3)
    expect(replaceChapterVerses).toHaveBeenCalled()
  })

  it('does not cache an incomplete API response', async () => {
    getVerses.mockReturnValue([])
    fetchChapterVerses.mockResolvedValue([
      ...makeVerses('JHN', 'Yohanes', 3, 1),
      { book: 'JHN', bookName: 'Yohanes', chapter: 3, verse: 3, text: 'Ayat 3' }
    ])

    await expect(getChapterVerses('tb', 'JHN', 3)).rejects.toThrow(
      'Incomplete chapter returned for JHN 3'
    )
    expect(replaceChapterVerses).not.toHaveBeenCalled()
  })

  it('deduplicates concurrent loads for the same chapter', async () => {
    const expected = 3
    const fetched = makeVerses('PHM', 'Filemon', 1, expected)
    getVerses.mockReturnValue([])
    fetchChapterVerses.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(fetched), 10)
        })
    )

    const [first, second] = await Promise.all([
      getChapterVerses('tb', 'PHM', 1),
      getChapterVerses('tb', 'PHM', 1)
    ])

    expect(first).toEqual(second)
    expect(fetchChapterVerses).toHaveBeenCalledTimes(1)
  })

  it('prefetches adjacent chapters after a successful load', async () => {
    getChapterCount.mockReturnValue(5)
    isChapterCached.mockImplementation(
      (_translationId: string, _bookId: string, chapter: number) => chapter === 3
    )
    getVerses.mockImplementation((_t: string, _b: string, chapter: number) =>
      chapter === 3 ? makeVerses('JHN', 'Yohanes', 3, 3) : []
    )
    fetchChapterVerses.mockImplementation(async (_t: string, _b: string, chapter: number) =>
      makeVerses('JHN', 'Yohanes', chapter, 3)
    )

    await getChapterVerses('tb', 'JHN', 3)
    await vi.waitFor(() => {
      expect(fetchChapterVerses).toHaveBeenCalledWith('tb', 'JHN', 2)
      expect(fetchChapterVerses).toHaveBeenCalledWith('tb', 'JHN', 4)
    })
  })
})
