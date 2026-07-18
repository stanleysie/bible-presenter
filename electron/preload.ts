import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  AppSettings,
  DisplayInfo,
  OutputState,
  PresentationTheme,
  Translation,
  VerseRange
} from '../shared/types'

const api = {
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke(IPC_CHANNELS.GET_DISPLAYS),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  setOutputDisplay: (displayId: number): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_OUTPUT_DISPLAY, displayId),
  setDefaultTranslation: (translationId: string): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_DEFAULT_TRANSLATION, translationId),
  updateTheme: (theme: PresentationTheme): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_THEME, theme),
  getTranslations: (): Promise<Translation[]> => ipcRenderer.invoke(IPC_CHANNELS.GET_TRANSLATIONS),
  getBooks: (translationId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_BOOKS, translationId),
  getChapters: (translationId: string, bookId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CHAPTERS, translationId, bookId),
  getVerses: (
    translationId: string,
    bookId: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ): Promise<VerseRange> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_VERSES, translationId, bookId, chapter, startVerse, endVerse),
  lookupReference: (translationId: string, reference: string): Promise<VerseRange | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOOKUP_REFERENCE, translationId, reference),
  showVerse: (payload: VerseRange): Promise<OutputState> =>
    ipcRenderer.invoke(IPC_CHANNELS.SHOW_VERSE, payload),
  clearOutput: (): Promise<OutputState> => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_OUTPUT),
  getOutputState: (): Promise<OutputState> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_OUTPUT_STATE),
  onOutputStateChanged: (callback: (state: OutputState) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: OutputState): void => callback(state)
    ipcRenderer.on(IPC_CHANNELS.OUTPUT_STATE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.OUTPUT_STATE_CHANGED, handler)
  }
}

contextBridge.exposeInMainWorld('biblePresenter', api)

export type BiblePresenterApi = typeof api
