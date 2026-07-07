import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearVerseServiceCache, getChapterVerses } from './verse-service'

const getVerses = vi.fn()
const insertVerses = vi.fn()
const fetchMayicuVerses = vi.fn()

vi.mock('./database', () => ({
  getVerses: (...args: unknown[]) => getVerses(...args),
  insertVerses: (...args: unknown[]) => insertVerses(...args)
}))

vi.mock('./mayicu-api', () => ({
  fetchMayicuVerses: (...args: unknown[]) => fetchMayicuVerses(...args)
}))

describe('getChapterVerses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearVerseServiceCache()
  })

  it('returns cached verses without calling the API', async () => {
    getVerses.mockReturnValue([
      {
        book: 'GEN',
        bookName: 'Kejadian',
        chapter: 1,
        verse: 1,
        text: 'Pada mulanya'
      }
    ])

    const verses = await getChapterVerses('tb', 'GEN', 1)

    expect(verses).toHaveLength(1)
    expect(fetchMayicuVerses).not.toHaveBeenCalled()
  })

  it('fetches and caches verses when not cached', async () => {
    getVerses.mockReturnValue([])
    fetchMayicuVerses.mockResolvedValue([
      {
        book: 'GEN',
        bookName: 'Kejadian',
        chapter: 1,
        verse: 1,
        text: 'Pada mulanya'
      }
    ])

    const verses = await getChapterVerses('tb', 'GEN', 1)

    expect(verses).toHaveLength(1)
    expect(fetchMayicuVerses).toHaveBeenCalledWith('tb', 'GEN', 1)
    expect(insertVerses).toHaveBeenCalledWith('tb', 'GEN', 1, [{ verse: 1, text: 'Pada mulanya' }])
  })

  it('deduplicates concurrent loads for the same chapter', async () => {
    getVerses.mockReturnValue([])
    fetchMayicuVerses.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve([
                {
                  book: 'GEN',
                  bookName: 'Kejadian',
                  chapter: 1,
                  verse: 1,
                  text: 'Pada mulanya'
                }
              ]),
            10
          )
        })
    )

    const [first, second] = await Promise.all([
      getChapterVerses('tb', 'GEN', 1),
      getChapterVerses('tb', 'GEN', 1)
    ])

    expect(first).toEqual(second)
    expect(fetchMayicuVerses).toHaveBeenCalledTimes(1)
  })
})
