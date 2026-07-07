import './autofit.css'
import { VERSE_LINE_HEIGHT } from './verse-layout'
import { useAutoFitFontSize, type AutoFitFontSizeOptions } from './useAutoFitFontSize'

export interface AutoFitVerseProps {
  text: string
  color: string
  containerClassName?: string
  verseClassName?: string
  autoFit?: AutoFitFontSizeOptions
}

export function AutoFitVerse({
  text,
  color,
  containerClassName = '',
  verseClassName = 'autofit-verse',
  autoFit
}: AutoFitVerseProps): JSX.Element {
  const { containerRef, textRef, fontSize } = useAutoFitFontSize(text, autoFit)

  return (
    <div ref={containerRef} className={`autofit-verse-container ${containerClassName}`.trim()}>
      <div
        ref={textRef}
        className={verseClassName}
        style={{
          color,
          fontSize,
          lineHeight: VERSE_LINE_HEIGHT
        }}
      >
        {text}
      </div>
    </div>
  )
}
