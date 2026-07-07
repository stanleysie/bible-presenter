import { OutputPreview } from '../shared/OutputPreview'
import { useEffect, useState } from 'react'
import type { OutputState } from '../shared/types'
import { DEFAULT_THEME } from '../shared/types'

export default function OutputApp(): JSX.Element {
  const [state, setState] = useState<OutputState>({
    active: false,
    payload: null,
    theme: DEFAULT_THEME
  })

  useEffect(() => {
    window.biblePresenter.getOutputState().then(setState)
    const unsub = window.biblePresenter.onOutputStateChanged(setState)
    return unsub
  }, [])

  const { theme, payload, active } = state

  return (
    <OutputPreview
      theme={theme}
      payload={payload}
      active={active}
      screenClassName="output-screen"
      slideContentClassName="slide-content"
      referenceClassName="output-reference slide-reference"
      verseClassName="output-verse autofit-verse slide-verse"
    />
  )
}
