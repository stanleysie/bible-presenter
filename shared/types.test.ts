import { describe, expect, it } from 'vitest'
import { BOOK_ID_TO_MAYICU_CODE } from './mayicu-books'
import { BIBLE_BOOKS, BOOK_NAME_TO_ID, TRANSLATIONS, getTranslationConfig } from './types'

describe('bible metadata', () => {
  it('ships only TB translation', () => {
    expect(TRANSLATIONS).toHaveLength(1)
    expect(TRANSLATIONS[0]).toMatchObject({
      id: 'tb',
      abbreviation: 'TB',
      locale: 'id',
      mayicuVersion: 'tb'
    })
  })

  it('contains 66 canonical books with Indonesian names', () => {
    expect(BIBLE_BOOKS).toHaveLength(66)
    expect(BIBLE_BOOKS[0].name).toBe('Kejadian')
    expect(BIBLE_BOOKS.find((book) => book.id === 'JHN')?.name).toBe('Yohanes')
  })

  it('maps every book id to a mayicu code', () => {
    for (const book of BIBLE_BOOKS) {
      expect(BOOK_ID_TO_MAYICU_CODE[book.id]).toBeTruthy()
    }
  })

  it('resolves Indonesian aliases used in quick reference', () => {
    expect(BOOK_NAME_TO_ID.yohanes).toBe('JHN')
    expect(BOOK_NAME_TO_ID['kisah para rasul']).toBe('ACT')
    expect(BOOK_NAME_TO_ID['1 korintus']).toBe('1CO')
  })

  it('returns translation config by id', () => {
    expect(getTranslationConfig('tb')?.mayicuVersion).toBe('tb')
    expect(getTranslationConfig('missing')).toBeUndefined()
  })
})
