import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync, existsSync } from 'fs'
import {
  closeDatabase,
  getBooks,
  getChapterCount,
  getTranslations,
  initDatabase
} from '../db/database'
import { getChapterVerses } from '../db/verse-service'
import { lookupReference } from '../db/reference'
import {
  DEFAULT_THEME,
  IPC_CHANNELS,
  TRANSLATIONS,
  type DisplayInfo,
  type OutputState,
  type PresentationTheme,
  type VerseRange
} from '../shared/types'
import { getSettings, setOutputDisplayId, setTheme } from './settings'

// WSL/Linux often lacks a working GPU stack for Chromium
function configureGraphicsForLinux(): void {
  if (process.platform !== 'linux') return

  let isWsl = false
  try {
    if (existsSync('/proc/version')) {
      const version = readFileSync('/proc/version', 'utf8').toLowerCase()
      isWsl = version.includes('microsoft') || version.includes('wsl')
    }
  } catch {
    // ignore
  }

  if (isWsl || process.env.FORCE_SOFTWARE_RENDER === '1') {
    app.disableHardwareAcceleration()
    app.commandLine.appendSwitch('disable-gpu')
    app.commandLine.appendSwitch('disable-gpu-sandbox')
    app.commandLine.appendSwitch('disable-dev-shm-usage')
  }
}

configureGraphicsForLinux()

// Load .env in development
function loadEnv(): void {
  const envPath = join(app.getAppPath(), '.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

let controlWindow: BrowserWindow | null = null
let outputWindow: BrowserWindow | null = null
let outputState: OutputState = {
  active: false,
  payload: null,
  theme: DEFAULT_THEME
}

function getDisplays(): DisplayInfo[] {
  return screen.getAllDisplays().map((display) => ({
    id: display.id,
    label: display.label || `Display ${display.id}`,
    bounds: display.bounds,
    isPrimary: display.id === screen.getPrimaryDisplay().id
  }))
}

function getOutputDisplay() {
  const displays = screen.getAllDisplays()
  const settings = getSettings()
  const saved = displays.find((d) => d.id === settings.outputDisplayId)
  if (saved) return saved
  if (displays.length > 1) return displays.find((d) => d.id !== screen.getPrimaryDisplay().id) ?? displays[0]
  return displays[0]
}

function createOutputWindow(): void {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.focus()
    return
  }

  const display = getOutputDisplay()
  const settings = getSettings()

  outputWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    show: false,
    frame: false,
    fullscreen: true,
    backgroundColor: settings.theme.backgroundColor,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  outputWindow.on('ready-to-show', () => {
    outputWindow?.show()
    outputWindow?.setFullScreen(true)
    broadcastOutputState()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    outputWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/output/index.html`)
  } else {
    outputWindow.loadFile(join(__dirname, '../renderer/output/index.html'))
  }

  outputWindow.on('closed', () => {
    outputWindow = null
  })
}

function createControlWindow(): void {
  controlWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Bible Presenter',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  controlWindow.on('ready-to-show', () => {
    controlWindow?.show()
    createOutputWindow()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    controlWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/src/index.html`)
  } else {
    controlWindow.loadFile(join(__dirname, '../renderer/src/index.html'))
  }

  controlWindow.on('closed', () => {
    controlWindow = null
    if (outputWindow && !outputWindow.isDestroyed()) {
      outputWindow.close()
    }
    app.quit()
  })
}

function broadcastOutputState(): void {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.webContents.send(IPC_CHANNELS.OUTPUT_STATE_CHANGED, outputState)
  }
}

function showVerse(payload: VerseRange): void {
  outputState = {
    active: true,
    payload,
    theme: getSettings().theme
  }
  broadcastOutputState()
}

function clearOutput(): void {
  outputState = {
    ...outputState,
    active: false,
    theme: getSettings().theme
  }
  broadcastOutputState()
}

function repositionOutputWindow(): void {
  if (!outputWindow || outputWindow.isDestroyed()) return
  const display = getOutputDisplay()
  outputWindow.setBounds(display.bounds)
  outputWindow.setFullScreen(true)
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_DISPLAYS, () => getDisplays())

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => getSettings())

  ipcMain.handle(IPC_CHANNELS.SET_OUTPUT_DISPLAY, (_event, displayId: number) => {
    setOutputDisplayId(displayId)
    repositionOutputWindow()
    return getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_THEME, (_event, theme: PresentationTheme) => {
    setTheme(theme)
    outputState = { ...outputState, theme }
    broadcastOutputState()
    return getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.GET_TRANSLATIONS, () => getTranslations())

  ipcMain.handle(IPC_CHANNELS.GET_BOOKS, (_event, translationId: string) =>
    getBooks(translationId)
  )

  ipcMain.handle(IPC_CHANNELS.GET_CHAPTERS, (_event, translationId: string, bookId: string) => {
    const count = getChapterCount(translationId, bookId)
    return Array.from({ length: count }, (_, i) => i + 1)
  })

  ipcMain.handle(
    IPC_CHANNELS.GET_VERSES,
    async (_event, translationId: string, bookId: string, chapter: number, startVerse?: number, endVerse?: number) => {
      const verses = await getChapterVerses(translationId, bookId, chapter, startVerse, endVerse)
      const translation = TRANSLATIONS.find((t) => t.id === translationId)
      const bookName = verses[0]?.bookName ?? ''
      return {
        translationId,
        translationAbbreviation: translation?.abbreviation ?? '',
        reference: verses.length > 0 ? `${bookName} ${chapter}` : '',
        verses
      } satisfies VerseRange
    }
  )

  ipcMain.handle(IPC_CHANNELS.LOOKUP_REFERENCE, async (_event, translationId: string, reference: string) => {
    const translation = TRANSLATIONS.find((t) => t.id === translationId)
    return lookupReference(translationId, translation?.abbreviation ?? '', reference)
  })

  ipcMain.handle(IPC_CHANNELS.SHOW_VERSE, (_event, payload: VerseRange) => {
    showVerse(payload)
    return outputState
  })

  ipcMain.handle(IPC_CHANNELS.CLEAR_OUTPUT, () => {
    clearOutput()
    return outputState
  })

  ipcMain.handle(IPC_CHANNELS.GET_OUTPUT_STATE, () => outputState)
}

app.whenReady().then(() => {
  loadEnv()
  electronApp.setAppUserModelId('com.biblepresenter.app')
  initDatabase()
  registerIpcHandlers()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createControlWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})

// Open external links in browser
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
