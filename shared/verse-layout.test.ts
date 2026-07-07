import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VERSE_FONT_SIZE,
  MIN_VERSE_FONT_SIZE,
  PREVIEW_MAX_VERSE_FONT_SIZE,
  PREVIEW_MIN_VERSE_FONT_SIZE,
  getPreferredVerseFontSize
} from './verse-layout'

describe('getPreferredVerseFontSize', () => {
  it('caps at default size on large containers', () => {
    expect(getPreferredVerseFontSize(1080, 1920)).toBe(DEFAULT_VERSE_FONT_SIZE)
  })

  it('respects custom max font size for preview', () => {
    expect(
      getPreferredVerseFontSize(
        180,
        320,
        PREVIEW_MAX_VERSE_FONT_SIZE,
        PREVIEW_MIN_VERSE_FONT_SIZE
      )
    ).toBeLessThanOrEqual(PREVIEW_MAX_VERSE_FONT_SIZE)
  })

  it('does not fall below preview minimum when capped', () => {
    expect(
      getPreferredVerseFontSize(
        40,
        80,
        PREVIEW_MAX_VERSE_FONT_SIZE,
        PREVIEW_MIN_VERSE_FONT_SIZE
      )
    ).toBeGreaterThanOrEqual(PREVIEW_MIN_VERSE_FONT_SIZE)
  })

  it('uses global minimum for full-screen sizing', () => {
    expect(getPreferredVerseFontSize(100, 100)).toBeGreaterThanOrEqual(MIN_VERSE_FONT_SIZE)
  })

  it('shrinks for narrow containers', () => {
    const size = getPreferredVerseFontSize(400, 200)
    expect(size).toBeLessThan(DEFAULT_VERSE_FONT_SIZE)
  })
})
