import type { CSSProperties } from 'react'
import slideBackgroundUrl from './assets/background.jpg'

const SLIDE_OVERLAY = 'rgba(0, 0, 0, 0.38)'

export function getSlideBackgroundStyle(fallbackColor: string): CSSProperties {
  return {
    backgroundColor: fallbackColor,
    backgroundImage: `linear-gradient(${SLIDE_OVERLAY}, ${SLIDE_OVERLAY}), url("${slideBackgroundUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
}
