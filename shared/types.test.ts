import { describe, expect, it } from 'vitest'
import {
  BOOK_ID_TO_ALKITAB_BOOK,
  BOOK_ID_TO_ALKITAB_ENGLISH_BOOK
} from './alkitab-books'
import { BOOK_ID_TO_MAYICU_CODE } from './mayicu-books'
import {
  BIBLE_BOOKS,
  BIBLE_LANGUAGES,
  BOOK_NAME_TO_ID,
  TRANSLATIONS,
  getLocalizedBibleBooks,
  getTranslationConfig
} from './types'

describe('bible metadata', () => {
  it('groups translations by language', () => {
    expect(BIBLE_LANGUAGES.map((language) => language.id)).toEqual(['id', 'en'])
    expect(TRANSLATIONS.filter((translation) => translation.languageId === 'id'))
      .toHaveLength(1)
    expect(TRANSLATIONS.filter((translation) => translation.languageId === 'en')
      .map((translation) => translation.id)).toEqual(['nkjv', 'niv'])
  })

  it('contains 66 canonical books with Indonesian names', () => {
    expect(BIBLE_BOOKS).toHaveLength(66)
    expect(BIBLE_BOOKS[0].name).toBe('Kejadian')
    expect(BIBLE_BOOKS.find((book) => book.id === 'JHN')?.name).toBe('Yohanes')
  })

  it('maps every book id to Mayicu and alkitab names', () => {
    for (const book of BIBLE_BOOKS) {
      expect(BOOK_ID_TO_MAYICU_CODE[book.id]).toBeTruthy()
      expect(BOOK_ID_TO_ALKITAB_BOOK[book.id]).toBeTruthy()
      expect(BOOK_ID_TO_ALKITAB_ENGLISH_BOOK[book.id]).toBeTruthy()
    }
  })

  it('localizes book names by language', () => {
    expect(getLocalizedBibleBooks('id')[0].name).toBe('Kejadian')
    expect(getLocalizedBibleBooks('en')[0].name).toBe('Genesis')
    expect(getLocalizedBibleBooks('en').find((book) => book.id === 'JHN')?.name).toBe('John')
  })

  it('resolves Indonesian aliases used in quick reference', () => {
    expect(BOOK_NAME_TO_ID.yohanes).toBe('JHN')
    expect(BOOK_NAME_TO_ID['kisah para rasul']).toBe('ACT')
    expect(BOOK_NAME_TO_ID['1 korintus']).toBe('1CO')
  })

  it('returns translation config by id', () => {
    expect(getTranslationConfig('tb')?.apiVersion).toBe('tb')
    expect(getTranslationConfig('nkjv')?.apiVersion).toBe('nkjv')
    expect(getTranslationConfig('niv')?.apiVersion).toBe('niv')
    expect(getTranslationConfig('missing')).toBeUndefined()
  })
})
