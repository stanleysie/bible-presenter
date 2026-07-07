import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMayicuChapterVerses, fetchMayicuVerses } from './mayicu-api'

describe('mayicu api', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { number: 16, text: ' Karena begitu besar kasih Allah akan dunia ini ' },
          { number: 17, text: 'Ayat 17' }
        ]
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses and sorts chapter verses', async () => {
    const verses = await fetchMayicuChapterVerses('tb', 'Yoh', 3)

    expect(verses).toEqual([
      { verse: 16, text: 'Karena begitu besar kasih Allah akan dunia ini' },
      { verse: 17, text: 'Ayat 17' }
    ])
  })

  it('maps verses to app verse objects', async () => {
    const verses = await fetchMayicuVerses('tb', 'JHN', 3, 16, 16)

    expect(verses).toEqual([
      {
        book: 'JHN',
        bookName: 'Yohanes',
        chapter: 3,
        verse: 16,
        text: 'Karena begitu besar kasih Allah akan dunia ini'
      }
    ])
  })

  it('throws for unknown translations', async () => {
    await expect(fetchMayicuVerses('unknown', 'JHN', 3)).rejects.toThrow(
      'Unknown translation: unknown'
    )
  })

  it('throws when API returns no verses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => []
      }))
    )

    await expect(fetchMayicuVerses('tb', 'JHN', 3)).rejects.toThrow(
      'No verses returned for Yohanes 3'
    )
  })

  it('throws on API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => 'server error'
      }))
    )

    await expect(fetchMayicuChapterVerses('tb', 'Yoh', 3)).rejects.toThrow(
      'Mayicu Alkitab API error 500'
    )
  })

  it('retries on rate limit and eventually succeeds', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ number: 1, text: 'Pada mulanya' }]
      })
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchMayicuChapterVerses('tb', 'Yoh', 3)
    await vi.runAllTimersAsync()
    const verses = await promise

    expect(verses).toEqual([{ verse: 1, text: 'Pada mulanya' }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('throws a friendly message when rate limit persists', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests'
      }))
    )

    const promise = fetchMayicuChapterVerses('tb', 'Yoh', 3)
    const expectation = expect(promise).rejects.toThrow(
      'Mayicu Alkitab API rate limit reached. Please wait a moment and try again.'
    )
    await vi.runAllTimersAsync()
    await expectation
    vi.useRealTimers()
  })
})
