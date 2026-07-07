import { describe, expect, it } from 'vitest'
import { formatDisplayReference } from './format-reference'

describe('formatDisplayReference', () => {
  it('formats reference with translation abbreviation', () => {
    expect(formatDisplayReference('Yohanes 3:16', 'TB')).toBe('Yohanes 3:16 (TB)')
  })

  it('returns empty string for empty reference', () => {
    expect(formatDisplayReference('', 'TB')).toBe('')
  })

  it('returns reference only when abbreviation is missing', () => {
    expect(formatDisplayReference('Kejadian 1:1', '')).toBe('Kejadian 1:1')
  })
})
