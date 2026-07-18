import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { MIN_VERSE_FONT_SIZE, getPreferredVerseFontSize } from './verse-layout'

export interface AutoFitFontSizeOptions {
  minFontSize?: number
  maxFontSize?: number
}

function fitsAt(
  textEl: HTMLDivElement,
  size: number,
  maxHeight: number,
  maxWidth: number
): boolean {
  textEl.style.fontSize = `${size}px`
  return textEl.scrollHeight <= maxHeight && textEl.scrollWidth <= maxWidth
}

export function useAutoFitFontSize(
  text: string,
  options: AutoFitFontSizeOptions = {}
): {
  containerRef: RefObject<HTMLDivElement>
  textRef: RefObject<HTMLDivElement>
  fontSize: number
} {
  const minFontSize = options.minFontSize ?? MIN_VERSE_FONT_SIZE
  const maxFontSize = options.maxFontSize
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(minFontSize)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const measure = (): void => {
      const maxHeight = container.clientHeight
      const maxWidth = container.clientWidth
      if (maxHeight <= 0 || maxWidth <= 0) return

      textEl.style.width = `${maxWidth}px`

      const preferred = getPreferredVerseFontSize(maxHeight, maxWidth, maxFontSize, minFontSize)
      let best = preferred

      if (!fitsAt(textEl, preferred, maxHeight, maxWidth)) {
        let low = minFontSize
        let high = preferred - 1
        best = minFontSize

        while (low <= high) {
          const mid = Math.floor((low + high) / 2)
          if (fitsAt(textEl, mid, maxHeight, maxWidth)) {
            best = mid
            low = mid + 1
          } else {
            high = mid - 1
          }
        }
      }

      setFontSize(best)
      textEl.style.fontSize = `${best}px`
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [text, minFontSize, maxFontSize])

  return {
    containerRef,
    textRef,
    fontSize
  }
}
