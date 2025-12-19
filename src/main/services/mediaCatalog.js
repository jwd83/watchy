import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'

let db = null
let suggestStmt = null

function getMediaCatalogDbPath() {
  if (!is.dev) {
    return path.join(process.resourcesPath, 'media_catalog.db')
  }

  const candidates = [
    // In many dev setups, Electron's app path points at the project root.
    path.join(app.getAppPath(), 'media_catalog.db'),

    // When built by electron-vite, main lives in `out/main/**`, so go back to repo root.
    path.join(__dirname, '../../../media_catalog.db'),

    // As a last resort, fall back to current working directory.
    path.join(process.cwd(), 'media_catalog.db')
  ]

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }

  // Default to first candidate for error messages.
  return candidates[0]
}

function escapeLike(value) {
  // Escape LIKE wildcards. We'll use ESCAPE '\\' in SQL.
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function getDb() {
  if (db) return db

  const dbPath = getMediaCatalogDbPath()
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true })
  } catch (err) {
    // Surface path in logs for easier diagnosis.
    console.error(`[MediaCatalog] Failed to open db at ${dbPath}`, err)
    throw err
  }

  suggestStmt = db.prepare(`
    SELECT
      Title         AS title,
      Year          AS year,
      IMDbID        AS imdbId,
      Type          AS type,
      primary_genre AS primaryGenre,
      runtime       AS runtime,
      Rating        AS rating,
      Votes         AS votes
    FROM media_catalog
    WHERE
      Title LIKE ? ESCAPE '\\' COLLATE NOCASE
      OR IMDbID LIKE ? ESCAPE '\\' COLLATE NOCASE
    ORDER BY
      (Title LIKE ? ESCAPE '\\' COLLATE NOCASE) DESC,
      Votes DESC
    LIMIT ?
  `)

  return db
}

class MediaCatalogService {
  suggest(rawQuery, limit = 10) {
    const q = (rawQuery || '').trim()
    if (q.length < 2) return []

    // Initialize on first use.
    try {
      getDb()
    } catch {
      return []
    }

    const safe = escapeLike(q)
    const contains = `%${safe}%`
    const prefix = `${safe}%`
    const imdbContains = `%${safe}%`

    const max = Math.max(1, Math.min(25, Number(limit) || 10))

    try {
      return suggestStmt.all(contains, imdbContains, prefix, max)
    } catch (err) {
      console.error('[MediaCatalog] suggest query failed', err)
      return []
    }
  }

  // Optional for future: close db on app quit.
  close() {
    try {
      if (db) db.close()
    } finally {
      db = null
      suggestStmt = null
    }
  }
}

export default new MediaCatalogService()
