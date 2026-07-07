export const MIN_VERSE_FONT_SIZE = 24
export const DEFAULT_VERSE_FONT_SIZE = 72
export const PREVIEW_MIN_VERSE_FONT_SIZE = 6
export const PREVIEW_MAX_VERSE_FONT_SIZE = 10
export const VERSE_LINE_HEIGHT = 1.5

/** Target size for typical verses — only shrinks when text overflows. */
export function getPreferredVerseFontSize(
  containerHeight: number,
  containerWidth: number,
  maxFontSize = DEFAULT_VERSE_FONT_SIZE,
  minFontSize = MIN_VERSE_FONT_SIZE
): number {
  const byHeight = Math.floor(containerHeight * 0.12)
  const byWidth = Math.floor(containerWidth / 12)
  const scaled = Math.min(byHeight, byWidth)

  return Math.max(
    minFontSize,
    Math.min(maxFontSize, scaled || maxFontSize)
  )
}
