import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getChapterVerses } = vi.hoisted(() => ({
  getChapterVerses: vi.fn()
}))

vi.mock('./verse-service', () => ({
  getChapterVerses
}))

import { lookupReference } from './reference'

describe('lookupReference', () => {
  beforeEach(() => {
    getChapterVerses.mockReset()
  })

  it('returns null for invalid references', async () => {
    await expect(lookupReference('tb', 'TB', 'invalid')).resolves.toBeNull()
    expect(getChapterVerses).not.toHaveBeenCalled()
  })

  it('loads a single verse from the API', async () => {
    getChapterVerses.mockResolvedValue([
      {
        book: 'JHN',
        bookName: 'Yohanes',
        chapter: 3,
        verse: 16,
        text: 'Karena begitu besar kasih Allah akan dunia ini'
      }
    ])

    const result = await lookupReference('tb', 'TB', 'Yohanes 3:16')

    expect(getChapterVerses).toHaveBeenCalledWith('tb', 'JHN', 3, 16, 16)
    expect(result).toEqual({
      translationId: 'tb',
      translationAbbreviation: 'TB',
      reference: 'Yohanes 3:16',
      verses: [
        {
          book: 'JHN',
          bookName: 'Yohanes',
          chapter: 3,
          verse: 16,
          text: 'Karena begitu besar kasih Allah akan dunia ini'
        }
      ]
    })
  })

  it('defaults to verse 1 when chapter only is provided', async () => {
    getChapterVerses.mockResolvedValue([
      {
        book: 'GEN',
        bookName: 'Kejadian',
        chapter: 1,
        verse: 1,
        text: 'Pada mulanya'
      }
    ])

    await lookupReference('tb', 'TB', 'Kejadian 1')

    expect(getChapterVerses).toHaveBeenCalledWith('tb', 'GEN', 1, 1, 1)
  })

  it('returns null when API returns no verses', async () => {
    getChapterVerses.mockResolvedValue([])

    await expect(lookupReference('tb', 'TB', 'Yohanes 3:16')).resolves.toBeNull()
  })

  it('accepts references with irregular whitespace', async () => {
    getChapterVerses.mockResolvedValue([
      {
        book: 'JHN',
        bookName: 'Yohanes',
        chapter: 3,
        verse: 16,
        text: 'Karena begitu besar kasih Allah akan dunia ini'
      }
    ])

    await lookupReference('tb', 'TB', '  Yohanes   3 : 16  ')

    expect(getChapterVerses).toHaveBeenCalledWith('tb', 'JHN', 3, 16, 16)
  })
})
