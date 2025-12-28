import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'

let db = null

function getPostersDbPath() {
  if (!is.dev) {
    return path.join(process.resourcesPath, 'posters.db')
  }

  const candidates = [
    path.join(app.getAppPath(), 'posters.db'),
    path.join(__dirname, '../../../posters.db'),
    path.join(process.cwd(), 'posters.db')
  ]

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }

  return candidates[0]
}

function getDb() {
  if (db) return db

  const dbPath = getPostersDbPath()
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true })
  } catch (err) {
    console.error(`[Posters] Failed to open db at ${dbPath}`, err)
    throw err
  }

  return db
}

class PostersService {
  getPostersByImdbIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return new Map()

    try {
      getDb()
    } catch {
      return new Map()
    }

    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`
      SELECT
        IMDbID AS imdbId,
        webp
      FROM posters
      WHERE IMDbID IN (${placeholders})
    `)

    try {
      const rows = stmt.all(...ids)
      const map = new Map()

      for (const row of rows) {
        // Convert BLOB to base64 data URL
        const base64 = Buffer.from(row.webp).toString('base64')
        const dataUrl = `data:image/webp;base64,${base64}`
        map.set(row.imdbId, dataUrl)
      }
      return map
    } catch (err) {
      console.error('[Posters] getPostersByImdbIds query failed', err)
      return new Map()
    }
  }

  close() {
    try {
      if (db) db.close()
    } finally {
      db = null
    }
  }
}

export default new PostersService()
