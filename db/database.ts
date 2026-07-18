import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { TRANSLATIONS, getLocalizedBibleBooks, getTranslationConfig } from '../shared/types'
import type { Book, Translation, Verse } from '../shared/types'

let db: Database.Database | null = null

export function getDbPath(): string {
  return join(app.getPath('userData'), 'bible-presenter.db')
}

export function initDatabase(): Database.Database {
  if (db) return db

  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      locale TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT NOT NULL,
      translation_id TEXT NOT NULL,
      name TEXT NOT NULL,
      book_order INTEGER NOT NULL,
      chapter_count INTEGER NOT NULL,
      PRIMARY KEY (translation_id, id),
      FOREIGN KEY (translation_id) REFERENCES translations(id)
    );

    CREATE TABLE IF NOT EXISTS verses (
      translation_id TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (translation_id, book, chapter, verse),
      FOREIGN KEY (translation_id) REFERENCES translations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_verses_lookup
      ON verses (translation_id, book, chapter, verse);

    CREATE TABLE IF NOT EXISTS chapter_cache (
      translation_id TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse_count INTEGER NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (translation_id, book, chapter),
      FOREIGN KEY (translation_id) REFERENCES translations(id)
    );
  `)

  seedTranslations()
  return db
}

function seedTranslations(): void {
  const database = db!
  const insertTranslation = database.prepare(`
    INSERT INTO translations (id, name, abbreviation, locale)
    VALUES (@id, @name, @abbreviation, @locale)
    ON CONFLICT (id) DO UPDATE SET
      name = excluded.name,
      abbreviation = excluded.abbreviation,
      locale = excluded.locale
  `)

  const insertBook = database.prepare(`
    INSERT INTO books (id, translation_id, name, book_order, chapter_count)
    VALUES (@id, @translationId, @name, @order, @chapters)
    ON CONFLICT (translation_id, id) DO UPDATE SET
      name = excluded.name,
      book_order = excluded.book_order,
      chapter_count = excluded.chapter_count
  `)

  const seed = database.transaction(() => {
    for (const translation of TRANSLATIONS) {
      insertTranslation.run({
        id: translation.id,
        name: translation.name,
        abbreviation: translation.abbreviation,
        locale: translation.locale
      })

      for (const book of getLocalizedBibleBooks(translation.languageId)) {
        insertBook.run({
          id: book.id,
          translationId: translation.id,
          name: book.name,
          order: book.order,
          chapters: book.chapters
        })
      }
    }
  })

  seed()
}

export function getTranslations(): Translation[] {
  const database = initDatabase()
  const rows = database
    .prepare('SELECT id, name, abbreviation, locale FROM translations ORDER BY name')
    .all() as Array<{ id: string; name: string; abbreviation: string; locale: string }>

  return rows
    .map((row) => {
      const config = getTranslationConfig(row.id)
      if (!config) return null
      return {
        ...config,
        name: row.name,
        abbreviation: row.abbreviation,
        locale: row.locale
      }
    })
    .filter((t): t is Translation => t !== null)
}

export function getBooks(translationId: string): Book[] {
  const database = initDatabase()
  return database
    .prepare(
      `SELECT id, translation_id as translationId, name, book_order as "order"
       FROM books WHERE translation_id = ? ORDER BY book_order`
    )
    .all(translationId) as Book[]
}

export function getChapterCount(translationId: string, bookId: string): number {
  const database = initDatabase()
  const row = database
    .prepare('SELECT chapter_count FROM books WHERE translation_id = ? AND id = ?')
    .get(translationId, bookId) as { chapter_count: number } | undefined
  return row?.chapter_count ?? 0
}

export function getVerses(
  translationId: string,
  bookId: string,
  chapter: number,
  startVerse?: number,
  endVerse?: number
): Verse[] {
  const database = initDatabase()
  const book = database
    .prepare('SELECT name FROM books WHERE translation_id = ? AND id = ?')
    .get(translationId, bookId) as { name: string } | undefined

  if (!book) return []

  let query = `
    SELECT book, chapter, verse, text
    FROM verses
    WHERE translation_id = ? AND book = ? AND chapter = ?
  `
  const params: (string | number)[] = [translationId, bookId, chapter]

  if (startVerse !== undefined) {
    query += ' AND verse >= ?'
    params.push(startVerse)
  }
  if (endVerse !== undefined) {
    query += ' AND verse <= ?'
    params.push(endVerse)
  }

  query += ' ORDER BY verse'

  const rows = database.prepare(query).all(...params) as Array<{
    book: string
    chapter: number
    verse: number
    text: string
  }>

  return rows.map((row) => ({
    book: row.book,
    bookName: book.name,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text
  }))
}

export function isChapterCached(translationId: string, bookId: string, chapter: number): boolean {
  const database = initDatabase()
  const row = database
    .prepare(
      `
    SELECT chapter_cache.verse_count AS expected_count, COUNT(verses.verse) AS actual_count
    FROM chapter_cache
    LEFT JOIN verses
      ON verses.translation_id = chapter_cache.translation_id
      AND verses.book = chapter_cache.book
      AND verses.chapter = chapter_cache.chapter
    WHERE chapter_cache.translation_id = ?
      AND chapter_cache.book = ?
      AND chapter_cache.chapter = ?
    GROUP BY chapter_cache.verse_count
  `
    )
    .get(translationId, bookId, chapter) as
    { expected_count: number; actual_count: number } | undefined

  return Boolean(row && row.expected_count > 0 && row.expected_count === row.actual_count)
}

export function insertVerses(
  translationId: string,
  bookId: string,
  chapter: number,
  verses: Array<{ verse: number; text: string }>
): void {
  const database = initDatabase()
  const insert = database.prepare(`
    INSERT OR REPLACE INTO verses (translation_id, book, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertMany = database.transaction((items: Array<{ verse: number; text: string }>) => {
    for (const item of items) {
      insert.run(translationId, bookId, chapter, item.verse, item.text)
    }
  })

  insertMany(verses)
}

/** Replace all verses for a chapter so incomplete cache rows cannot linger. */
export function replaceChapterVerses(
  translationId: string,
  bookId: string,
  chapter: number,
  verses: Array<{ verse: number; text: string }>
): void {
  const database = initDatabase()
  const deleteChapter = database.prepare(`
    DELETE FROM verses
    WHERE translation_id = ? AND book = ? AND chapter = ?
  `)
  const insert = database.prepare(`
    INSERT INTO verses (translation_id, book, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?)
  `)
  const markCached = database.prepare(`
    INSERT INTO chapter_cache (translation_id, book, chapter, verse_count, fetched_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT (translation_id, book, chapter) DO UPDATE SET
      verse_count = excluded.verse_count,
      fetched_at = excluded.fetched_at
  `)

  const replace = database.transaction((items: Array<{ verse: number; text: string }>) => {
    deleteChapter.run(translationId, bookId, chapter)
    for (const item of items) {
      insert.run(translationId, bookId, chapter, item.verse, item.text)
    }
    markCached.run(translationId, bookId, chapter, items.length)
  })

  replace(verses)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
