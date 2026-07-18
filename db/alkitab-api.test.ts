import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAlkitabChapterVerses, fetchAlkitabVerses, parseAlkitabVerses } from './alkitab-api'

function contentVerses(count: number): Array<{ verse: number; type: string; content: string }> {
  return Array.from({ length: count }, (_, index) => ({
    verse: index + 1,
    type: 'content',
    content: `Ayat ${index + 1}`
  }))
}

describe('alkitab api', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            passages: {
              verses: [
                { verse: 1, type: 'title', content: 'Percakapan dengan Nikodemus' },
                { verse: 1, type: 'content', content: ' Ada seorang Farisi ' },
                { verse: 2, type: 'content', content: 'Ia datang pada waktu malam' }
              ]
            }
          }
        })
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('filters titles and trims content verses', () => {
    expect(
      parseAlkitabVerses([
        { verse: 1, type: 'title', content: 'Title' },
        { verse: 0, type: 'content', content: 'Copyright footer' },
        { verse: 1, type: 'content', content: ' Verse one ' },
        { verse: 2, type: 'content', content: 'Verse two' }
      ])
    ).toEqual([
      { verse: 1, text: 'Verse one' },
      { verse: 2, text: 'Verse two' }
    ])
  })

  it('maps verses to app verse objects for a complete chapter', async () => {
    const expected = 3
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            passages: {
              verses: contentVerses(expected)
            }
          }
        })
      }))
    )

    const verses = await fetchAlkitabVerses('tb', 'PHM', 1, 1, 1)

    expect(verses).toEqual([
      {
        book: 'PHM',
        bookName: 'Filemon',
        chapter: 1,
        verse: 1,
        text: 'Ayat 1'
      }
    ])

    const fetchMock = vi.mocked(fetch)
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String(init?.body))
    expect(body.variables).toEqual({
      version: 'tb',
      book: 'Filemon',
      chapter: 1
    })
  })

  it('throws for unknown translations', async () => {
    await expect(fetchAlkitabVerses('unknown', 'JHN', 3)).rejects.toThrow(
      'Unknown translation: unknown'
    )
  })

  it('throws when the chapter is incomplete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            passages: {
              verses: [
                { verse: 1, type: 'content', content: 'One' },
                { verse: 3, type: 'content', content: 'Three' }
              ]
            }
          }
        })
      }))
    )

    await expect(fetchAlkitabVerses('tb', 'JHN', 3)).rejects.toThrow(
      'Incomplete chapter returned for Yohanes 3'
    )
  })

  it('throws on GraphQL errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          errors: [{ message: 'boom' }]
        })
      }))
    )

    await expect(fetchAlkitabChapterVerses('tb', 'Yohanes', 3)).rejects.toThrow('boom')
  })

  it('throws on HTTP errors', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => 'server error'
      }))
    )

    const promise = fetchAlkitabChapterVerses('tb', 'Yohanes', 3)
    const expectation = expect(promise).rejects.toThrow('Alkitab API error 500')
    await vi.runAllTimersAsync()
    await expectation
  })

  it('retries on rate limit and eventually succeeds', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'slow down'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            passages: {
              verses: contentVerses(1)
            }
          }
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchAlkitabChapterVerses('tb', 'Filemon', 1)
    await vi.runAllTimersAsync()
    const verses = await promise

    expect(verses).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries on timeout and then fails', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })
    )

    const promise = fetchAlkitabChapterVerses('tb', 'Yohanes', 3)
    const expectation = expect(promise).rejects.toThrow('Alkitab API request timed out')
    await vi.runAllTimersAsync()
    await expectation
  })
})
