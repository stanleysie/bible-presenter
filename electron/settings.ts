import Store from 'electron-store'
import { DEFAULT_THEME, type AppSettings } from '../shared/types'

const store = new Store<AppSettings>({
  name: 'settings',
  defaults: {
    outputDisplayId: null,
    defaultTranslationId: 'tb',
    theme: DEFAULT_THEME
  }
})

export function getSettings(): AppSettings {
  return {
    outputDisplayId: store.get('outputDisplayId'),
    defaultTranslationId: store.get('defaultTranslationId'),
    theme: store.get('theme')
  }
}

export function setOutputDisplayId(displayId: number | null): void {
  store.set('outputDisplayId', displayId)
}

export function setDefaultTranslationId(translationId: string): void {
  store.set('defaultTranslationId', translationId)
}

export function setTheme(theme: AppSettings['theme']): void {
  store.set('theme', theme)
}
