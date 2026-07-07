import { AutoFitVerse } from './AutoFitVerse'
import {
  PREVIEW_MAX_VERSE_FONT_SIZE,
  PREVIEW_MIN_VERSE_FONT_SIZE
} from './verse-layout'
import { formatDisplayReference } from './format-reference'
import { getSlideBackgroundStyle } from './slide-background'
import type { PresentationTheme, VerseRange } from './types'

export interface OutputPreviewProps {
  theme: PresentationTheme
  payload: VerseRange | null
  active: boolean
  className?: string
  screenClassName?: string
  slideContentClassName?: string
  referenceClassName?: string
  verseClassName?: string
}

export function OutputPreview({
  theme,
  payload,
  active,
  className = '',
  screenClassName = 'output-preview-screen',
  slideContentClassName = 'slide-content output-preview-slide-content',
  referenceClassName = 'output-preview-reference slide-reference',
  verseClassName = 'output-preview-verse autofit-verse slide-verse'
}: OutputPreviewProps): JSX.Element {
  const verse = payload?.verses[0]
  const isCompact = screenClassName === 'output-preview-screen'

  const screen = (
    <div
      className={screenClassName}
      style={getSlideBackgroundStyle(theme.backgroundColor)}
      aria-label="Projector preview"
    >
      {active && payload && verse && (
        <div className={slideContentClassName}>
          <div className={referenceClassName} style={{ color: theme.textColor }}>
            {formatDisplayReference(payload.reference, payload.translationAbbreviation)}
          </div>
            <AutoFitVerse
              text={verse.text}
              color={theme.textColor}
              verseClassName={verseClassName}
              autoFit={
                isCompact
                  ? {
                      minFontSize: PREVIEW_MIN_VERSE_FONT_SIZE,
                      maxFontSize: PREVIEW_MAX_VERSE_FONT_SIZE
                    }
                  : undefined
              }
            />
        </div>
      )}
    </div>
  )

  if (!className) return screen

  return <div className={className}>{screen}</div>
}
