import { describe, expect, it } from 'vitest'
import { formatReference, parseReference } from './reference'
import type { Verse } from '../shared/types'

describe('parseReference', () => {
  it('parses Indonesian book references', () => {
    expect(parseReference('Yohanes 3:16')).toEqual({
      bookId: 'JHN',
      chapter: 3,
      startVerse: 16,
      endVerse: 16
    })
  })

  it('parses English aliases', () => {
    expect(parseReference('John 3:16')).toEqual({
      bookId: 'JHN',
      chapter: 3,
      startVerse: 16,
      endVerse: 16
    })
  })

  it('parses chapter-only references', () => {
    expect(parseReference('Roma 12')).toEqual({
      bookId: 'ROM',
      chapter: 12,
      startVerse: undefined,
      endVerse: undefined
    })
  })

  it('parses verse ranges', () => {
    expect(parseReference('Mazmur 23:1-6')).toEqual({
      bookId: 'PSA',
      chapter: 23,
      startVerse: 1,
      endVerse: 6
    })
  })

  it('rejects invalid chapter counts', () => {
    expect(parseReference('Yudas 5')).toBeNull()
  })

  it('rejects unknown books', () => {
    expect(parseReference('NotABook 1:1')).toBeNull()
  })

  it('rejects empty input', () => {
    expect(parseReference('   ')).toBeNull()
  })
})

describe('formatReference', () => {
  const verse = (overrides: Partial<Verse>): Verse => ({
    book: 'ROM',
    bookName: 'Roma',
    chapter: 12,
    verse: 9,
    text: 'Sample text',
    ...overrides
  })

  it('formats a single verse', () => {
    expect(formatReference([verse({})])).toBe('Roma 12:9')
  })

  it('formats a verse range in one chapter', () => {
    expect(
      formatReference([verse({ verse: 9 }), verse({ verse: 11 })])
    ).toBe('Roma 12:9-11')
  })

  it('formats a cross-chapter range', () => {
    expect(
      formatReference([verse({ chapter: 12, verse: 9 }), verse({ chapter: 13, verse: 2 })])
    ).toBe('Roma 12:9-13:2')
  })

  it('returns empty string for no verses', () => {
    expect(formatReference([])).toBe('')
  })
})
