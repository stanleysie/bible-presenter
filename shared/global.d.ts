/// <reference types="vite/client" />

import type { BiblePresenterApi } from '../electron/preload'

declare global {
  interface Window {
    biblePresenter: BiblePresenterApi
  }
}

export {}
