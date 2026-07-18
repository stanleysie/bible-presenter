import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMayicuChapterVerses, fetchMayicuVerses, parseMayicuVerses } from './mayicu-api'

function contentVerses(count: number): Array<{ number: number; text: string }> {
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    text: ` Verse ${index + 1} `
  }))
}

describe('mayicu api', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => contentVerses(3)
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('parses and sorts chapter verses', () => {
    expect(
      parseMayicuVerses([
        { number: 2, text: ' Two ' },
        { number: 1, text: 'One' },
        { number: 0, text: 'ignored' }
      ])
    ).toEqual([
      { verse: 1, text: 'One' },
      { verse: 2, text: 'Two' }
    ])
  })

  it('maps TB verses and builds the Mayicu path', async () => {
    const verses = await fetchMayicuVerses('tb', 'PHM', 1, 1, 1)

    expect(verses).toEqual([
      {
        book: 'PHM',
        bookName: 'Filemon',
        chapter: 1,
        verse: 1,
        text: 'Verse 1'
      }
    ])

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://mayicu.id/api/alkitab/v1/tb/Flm/1/1/200',
      expect.objectContaining({
        headers: { Accept: 'application/json' }
      })
    )
  })

  it('maps English versions with the same Indonesian book codes', async () => {
    await fetchMayicuChapterVerses('nkjv', 'Yoh', 3)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://mayicu.id/api/alkitab/v1/nkjv/Yoh/3/1/200',
      expect.any(Object)
    )

    await fetchMayicuChapterVerses('niv', 'Yoh', 3)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://mayicu.id/api/alkitab/v1/niv/Yoh/3/1/200',
      expect.any(Object)
    )
  })

  it('throws for unknown translations', async () => {
    await expect(fetchMayicuVerses('unknown', 'JHN', 3)).rejects.toThrow(
      'Unknown translation: unknown'
    )
  })

  it('throws when the chapter is incomplete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { number: 1, text: 'One' },
          { number: 3, text: 'Three' }
        ]
      }))
    )

    await expect(fetchMayicuVerses('tb', 'JHN', 3)).rejects.toThrow(
      'Incomplete chapter returned for Yohanes 3'
    )
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

    const promise = fetchMayicuChapterVerses('tb', 'Yoh', 3)
    const expectation = expect(promise).rejects.toThrow('Mayicu Alkitab API error 500')
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
        json: async () => contentVerses(1)
      })

    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchMayicuChapterVerses('tb', 'Flm', 1)
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

    const promise = fetchMayicuChapterVerses('tb', 'Yoh', 3)
    const expectation = expect(promise).rejects.toThrow('Mayicu Alkitab API request timed out')
    await vi.runAllTimersAsync()
    await expectation
  })
})
