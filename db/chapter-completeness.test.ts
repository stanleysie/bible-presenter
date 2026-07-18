import { describe, expect, it } from 'vitest'
import { isCompleteChapter } from './chapter-completeness'

describe('isCompleteChapter', () => {
  it('accepts a structurally valid contiguous chapter', () => {
    const verses = Array.from({ length: 3 }, (_, index) => ({
      verse: index + 1,
      text: `Ayat ${index + 1}`
    }))

    expect(isCompleteChapter(verses, true)).toBe(true)
  })

  it('rejects chapters that start after verse 1', () => {
    expect(
      isCompleteChapter([
        { verse: 16, text: 'Karena begitu besar kasih Allah' }
      ], true)
    ).toBe(false)
  })

  it('accepts non-contiguous numbering for translations with omitted verses', () => {
    expect(
      isCompleteChapter([
        { verse: 1, text: 'One' },
        { verse: 3, text: 'Three' }
      ], false)
    ).toBe(true)
  })

  it('rejects gaps for contiguous translations', () => {
    expect(
      isCompleteChapter([
        { verse: 1, text: 'One' },
        { verse: 3, text: 'Three' }
      ], true)
    ).toBe(false)
  })
})
