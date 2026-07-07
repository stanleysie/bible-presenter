export const IPC_CHANNELS = {
  // Display
  GET_DISPLAYS: 'get-displays',
  GET_SETTINGS: 'get-settings',
  SET_OUTPUT_DISPLAY: 'set-output-display',
  UPDATE_THEME: 'update-theme',

  // Bible data
  GET_TRANSLATIONS: 'get-translations',
  GET_BOOKS: 'get-books',
  GET_CHAPTERS: 'get-chapters',
  GET_VERSES: 'get-verses',
  LOOKUP_REFERENCE: 'lookup-reference',

  // Presentation
  SHOW_VERSE: 'show-verse',
  CLEAR_OUTPUT: 'clear-output',
  GET_OUTPUT_STATE: 'get-output-state',
  OUTPUT_STATE_CHANGED: 'output-state-changed'
} as const

export interface DisplayInfo {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  isPrimary: boolean
}

export interface AppSettings {
  outputDisplayId: number | null
  defaultTranslationId: string
  theme: PresentationTheme
}

export interface PresentationTheme {
  backgroundColor: string
  textColor: string
}

export interface Translation {
  id: string
  name: string
  abbreviation: string
  locale: string
  mayicuVersion: string
}

export interface Book {
  id: string
  translationId: string
  name: string
  order: number
}

export interface Verse {
  book: string
  bookName: string
  chapter: number
  verse: number
  text: string
}

export interface VerseRange {
  translationId: string
  translationAbbreviation: string
  reference: string
  verses: Verse[]
}

export interface OutputState {
  active: boolean
  payload: VerseRange | null
  theme: PresentationTheme
}

export const DEFAULT_THEME: PresentationTheme = {
  backgroundColor: '#000000',
  textColor: '#ffffff'
}

export const TRANSLATIONS: Translation[] = [
  {
    id: 'tb',
    name: 'Terjemahan Baru',
    abbreviation: 'TB',
    locale: 'id',
    mayicuVersion: 'tb'
  }
]

export function getTranslationConfig(id: string): Translation | undefined {
  return TRANSLATIONS.find((t) => t.id === id)
}

export const BIBLE_BOOKS = [
  { id: 'GEN', name: 'Kejadian', order: 1, chapters: 50 },
  { id: 'EXO', name: 'Keluaran', order: 2, chapters: 40 },
  { id: 'LEV', name: 'Imamat', order: 3, chapters: 27 },
  { id: 'NUM', name: 'Bilangan', order: 4, chapters: 36 },
  { id: 'DEU', name: 'Ulangan', order: 5, chapters: 34 },
  { id: 'JOS', name: 'Yosua', order: 6, chapters: 24 },
  { id: 'JDG', name: 'Hakim-hakim', order: 7, chapters: 21 },
  { id: 'RUT', name: 'Rut', order: 8, chapters: 4 },
  { id: '1SA', name: '1 Samuel', order: 9, chapters: 31 },
  { id: '2SA', name: '2 Samuel', order: 10, chapters: 24 },
  { id: '1KI', name: '1 Raja-raja', order: 11, chapters: 22 },
  { id: '2KI', name: '2 Raja-raja', order: 12, chapters: 25 },
  { id: '1CH', name: '1 Tawarikh', order: 13, chapters: 29 },
  { id: '2CH', name: '2 Tawarikh', order: 14, chapters: 36 },
  { id: 'EZR', name: 'Ezra', order: 15, chapters: 10 },
  { id: 'NEH', name: 'Nehemia', order: 16, chapters: 13 },
  { id: 'EST', name: 'Ester', order: 17, chapters: 10 },
  { id: 'JOB', name: 'Ayub', order: 18, chapters: 42 },
  { id: 'PSA', name: 'Mazmur', order: 19, chapters: 150 },
  { id: 'PRO', name: 'Amsal', order: 20, chapters: 31 },
  { id: 'ECC', name: 'Pengkhotbah', order: 21, chapters: 12 },
  { id: 'SNG', name: 'Kidung Agung', order: 22, chapters: 8 },
  { id: 'ISA', name: 'Yesaya', order: 23, chapters: 66 },
  { id: 'JER', name: 'Yeremia', order: 24, chapters: 52 },
  { id: 'LAM', name: 'Ratapan', order: 25, chapters: 5 },
  { id: 'EZK', name: 'Yehezkiel', order: 26, chapters: 48 },
  { id: 'DAN', name: 'Daniel', order: 27, chapters: 12 },
  { id: 'HOS', name: 'Hosea', order: 28, chapters: 14 },
  { id: 'JOL', name: 'Yoel', order: 29, chapters: 3 },
  { id: 'AMO', name: 'Amos', order: 30, chapters: 9 },
  { id: 'OBA', name: 'Obaja', order: 31, chapters: 1 },
  { id: 'JON', name: 'Yunus', order: 32, chapters: 4 },
  { id: 'MIC', name: 'Mikha', order: 33, chapters: 7 },
  { id: 'NAM', name: 'Nahum', order: 34, chapters: 3 },
  { id: 'HAB', name: 'Habakuk', order: 35, chapters: 3 },
  { id: 'ZEP', name: 'Zefanya', order: 36, chapters: 3 },
  { id: 'HAG', name: 'Hagai', order: 37, chapters: 2 },
  { id: 'ZEC', name: 'Zakharia', order: 38, chapters: 14 },
  { id: 'MAL', name: 'Maleakhi', order: 39, chapters: 4 },
  { id: 'MAT', name: 'Matius', order: 40, chapters: 28 },
  { id: 'MRK', name: 'Markus', order: 41, chapters: 16 },
  { id: 'LUK', name: 'Lukas', order: 42, chapters: 24 },
  { id: 'JHN', name: 'Yohanes', order: 43, chapters: 21 },
  { id: 'ACT', name: 'Kisah Para Rasul', order: 44, chapters: 28 },
  { id: 'ROM', name: 'Roma', order: 45, chapters: 16 },
  { id: '1CO', name: '1 Korintus', order: 46, chapters: 16 },
  { id: '2CO', name: '2 Korintus', order: 47, chapters: 13 },
  { id: 'GAL', name: 'Galatia', order: 48, chapters: 6 },
  { id: 'EPH', name: 'Efesus', order: 49, chapters: 6 },
  { id: 'PHP', name: 'Filipi', order: 50, chapters: 4 },
  { id: 'COL', name: 'Kolose', order: 51, chapters: 4 },
  { id: '1TH', name: '1 Tesalonika', order: 52, chapters: 5 },
  { id: '2TH', name: '2 Tesalonika', order: 53, chapters: 3 },
  { id: '1TI', name: '1 Timotius', order: 54, chapters: 6 },
  { id: '2TI', name: '2 Timotius', order: 55, chapters: 4 },
  { id: 'TIT', name: 'Titus', order: 56, chapters: 3 },
  { id: 'PHM', name: 'Filemon', order: 57, chapters: 1 },
  { id: 'HEB', name: 'Ibrani', order: 58, chapters: 13 },
  { id: 'JAS', name: 'Yakobus', order: 59, chapters: 5 },
  { id: '1PE', name: '1 Petrus', order: 60, chapters: 5 },
  { id: '2PE', name: '2 Petrus', order: 61, chapters: 3 },
  { id: '1JN', name: '1 Yohanes', order: 62, chapters: 5 },
  { id: '2JN', name: '2 Yohanes', order: 63, chapters: 1 },
  { id: '3JN', name: '3 Yohanes', order: 64, chapters: 1 },
  { id: 'JUD', name: 'Yudas', order: 65, chapters: 1 },
  { id: 'REV', name: 'Wahyu', order: 66, chapters: 22 }
]

export const BOOK_NAME_TO_ID: Record<string, string> = {
  genesis: 'GEN',
  gen: 'GEN',
  exodus: 'EXO',
  exo: 'EXO',
  ex: 'EXO',
  leviticus: 'LEV',
  lev: 'LEV',
  numbers: 'NUM',
  num: 'NUM',
  deuteronomy: 'DEU',
  deut: 'DEU',
  deu: 'DEU',
  joshua: 'JOS',
  jos: 'JOS',
  judges: 'JDG',
  jdg: 'JDG',
  ruth: 'RUT',
  rut: 'RUT',
  '1 samuel': '1SA',
  '1samuel': '1SA',
  '1 sam': '1SA',
  '1sam': '1SA',
  '1sa': '1SA',
  '2 samuel': '2SA',
  '2samuel': '2SA',
  '2 sam': '2SA',
  '2sam': '2SA',
  '2sa': '2SA',
  '1 kings': '1KI',
  '1kings': '1KI',
  '1 ki': '1KI',
  '1ki': '1KI',
  '2 kings': '2KI',
  '2kings': '2KI',
  '2 ki': '2KI',
  '2ki': '2KI',
  '1 chronicles': '1CH',
  '1chronicles': '1CH',
  '1 chr': '1CH',
  '1ch': '1CH',
  '2 chronicles': '2CH',
  '2chronicles': '2CH',
  '2 chr': '2CH',
  '2ch': '2CH',
  ezra: 'EZR',
  ezr: 'EZR',
  nehemiah: 'NEH',
  neh: 'NEH',
  esther: 'EST',
  est: 'EST',
  job: 'JOB',
  psalms: 'PSA',
  psalm: 'PSA',
  psa: 'PSA',
  ps: 'PSA',
  proverbs: 'PRO',
  prov: 'PRO',
  pro: 'PRO',
  ecclesiastes: 'ECC',
  eccl: 'ECC',
  ecc: 'ECC',
  'song of solomon': 'SNG',
  song: 'SNG',
  sng: 'SNG',
  isaiah: 'ISA',
  isa: 'ISA',
  jeremiah: 'JER',
  jer: 'JER',
  lamentations: 'LAM',
  lam: 'LAM',
  ezekiel: 'EZK',
  ezek: 'EZK',
  ezk: 'EZK',
  daniel: 'DAN',
  dan: 'DAN',
  hosea: 'HOS',
  hos: 'HOS',
  joel: 'JOL',
  jol: 'JOL',
  amos: 'AMO',
  amo: 'AMO',
  obadiah: 'OBA',
  oba: 'OBA',
  obaja: 'OBA',
  jonah: 'JON',
  jon: 'JON',
  micah: 'MIC',
  mic: 'MIC',
  nahum: 'NAM',
  nam: 'NAM',
  habakkuk: 'HAB',
  hab: 'HAB',
  zephaniah: 'ZEP',
  zep: 'ZEP',
  haggai: 'HAG',
  hag: 'HAG',
  zechariah: 'ZEC',
  zec: 'ZEC',
  malachi: 'MAL',
  mal: 'MAL',
  matthew: 'MAT',
  matt: 'MAT',
  mat: 'MAT',
  mark: 'MRK',
  mrk: 'MRK',
  mk: 'MRK',
  luke: 'LUK',
  luk: 'LUK',
  lk: 'LUK',
  john: 'JHN',
  jhn: 'JHN',
  jn: 'JHN',
  acts: 'ACT',
  act: 'ACT',
  romans: 'ROM',
  rom: 'ROM',
  '1 corinthians': '1CO',
  '1corinthians': '1CO',
  '1 cor': '1CO',
  '1cor': '1CO',
  '1co': '1CO',
  '2 corinthians': '2CO',
  '2corinthians': '2CO',
  '2 cor': '2CO',
  '2cor': '2CO',
  '2co': '2CO',
  galatians: 'GAL',
  gal: 'GAL',
  ephesians: 'EPH',
  eph: 'EPH',
  philippians: 'PHP',
  phil: 'PHP',
  php: 'PHP',
  colossians: 'COL',
  col: 'COL',
  '1 thessalonians': '1TH',
  '1thessalonians': '1TH',
  '1 thess': '1TH',
  '1thess': '1TH',
  '1th': '1TH',
  '2 thessalonians': '2TH',
  '2thessalonians': '2TH',
  '2 thess': '2TH',
  '2thess': '2TH',
  '2th': '2TH',
  '1 timothy': '1TI',
  '1timothy': '1TI',
  '1 tim': '1TI',
  '1tim': '1TI',
  '1ti': '1TI',
  '2 timothy': '2TI',
  '2timothy': '2TI',
  '2 tim': '2TI',
  '2tim': '2TI',
  '2ti': '2TI',
  titus: 'TIT',
  tit: 'TIT',
  philemon: 'PHM',
  phlm: 'PHM',
  phm: 'PHM',
  hebrews: 'HEB',
  heb: 'HEB',
  james: 'JAS',
  jas: 'JAS',
  jm: 'JAS',
  '1 peter': '1PE',
  '1peter': '1PE',
  '1 pet': '1PE',
  '1pet': '1PE',
  '1pe': '1PE',
  '2 peter': '2PE',
  '2peter': '2PE',
  '2 pet': '2PE',
  '2pet': '2PE',
  '2pe': '2PE',
  '1 john': '1JN',
  '1john': '1JN',
  '1 jn': '1JN',
  '1jn': '1JN',
  '2 john': '2JN',
  '2john': '2JN',
  '2 jn': '2JN',
  '2jn': '2JN',
  '3 john': '3JN',
  '3john': '3JN',
  '3 jn': '3JN',
  '3jn': '3JN',
  jude: 'JUD',
  jud: 'JUD',
  revelation: 'REV',
  rev: 'REV',
  re: 'REV',
  kejadian: 'GEN',
  keluaran: 'EXO',
  imamat: 'LEV',
  bilangan: 'NUM',
  ulangan: 'DEU',
  yosua: 'JOS',
  'hakim-hakim': 'JDG',
  '1 raja-raja': '1KI',
  '2 raja-raja': '2KI',
  '1 raja': '1KI',
  '2 raja': '2KI',
  '1 tawarikh': '1CH',
  '2 tawarikh': '2CH',
  nehemia: 'NEH',
  ester: 'EST',
  ayub: 'JOB',
  mazmur: 'PSA',
  amsal: 'PRO',
  pengkhotbah: 'ECC',
  'kidung agung': 'SNG',
  yesaya: 'ISA',
  yeremia: 'JER',
  ratapan: 'LAM',
  yehezkiel: 'EZK',
  yoel: 'JOL',
  yunus: 'JON',
  mikha: 'MIC',
  habakuk: 'HAB',
  zefanya: 'ZEP',
  hagai: 'HAG',
  zakharia: 'ZEC',
  maleakhi: 'MAL',
  matius: 'MAT',
  markus: 'MRK',
  lukas: 'LUK',
  yohanes: 'JHN',
  'kisah para rasul': 'ACT',
  'kisah para rasul-rasul': 'ACT',
  roma: 'ROM',
  '1 korintus': '1CO',
  '2 korintus': '2CO',
  galatia: 'GAL',
  efesus: 'EPH',
  filipi: 'PHP',
  kolose: 'COL',
  '1 tesalonika': '1TH',
  '2 tesalonika': '2TH',
  '1 timotius': '1TI',
  '2 timotius': '2TI',
  filemon: 'PHM',
  ibrani: 'HEB',
  yakobus: 'JAS',
  '1 petrus': '1PE',
  '2 petrus': '2PE',
  '1 yohanes': '1JN',
  '2 yohanes': '2JN',
  '3 yohanes': '3JN',
  yudas: 'JUD',
  wahyu: 'REV'
}
