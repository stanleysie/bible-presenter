import { describe, expect, it, vi } from 'vitest'

vi.mock('./assets/background.jpg', () => ({
  default: '/test-background.jpg'
}))

import { getSlideBackgroundStyle } from './slide-background'

describe('slide background', () => {
  it('builds layered background style with fallback color', () => {
    const style = getSlideBackgroundStyle('#000000')

    expect(style.backgroundColor).toBe('#000000')
    expect(style.backgroundImage).toContain('linear-gradient')
    expect(style.backgroundImage).toContain('/test-background.jpg')
    expect(style.backgroundSize).toBe('cover')
    expect(style.backgroundPosition).toBe('center')
    expect(style.backgroundRepeat).toBe('no-repeat')
  })
})
