import https from 'https'

const CATALOG_URL = 'https://posters.jwd.me/catalog.txt'
const BASE_IMAGE_URL = 'https://posters.jwd.me/raw/'

// Map of imdbId -> filename (including extension)
const catalog = new Map()
let isCatalogLoaded = false
let catalogLoadPromise = null

async function loadCatalog() {
  if (catalogLoadPromise) {
    return catalogLoadPromise
  }

  catalogLoadPromise = (async () => {
    try {
      console.log('[Posters] Fetching catalog from', CATALOG_URL)
      const text = await fetchText(CATALOG_URL)
      const lines = text.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        const filename = line.trim()
        if (!filename) continue

        // Extract imdbId from filename (format: {imdbid}.ext)
        const lastDotIndex = filename.lastIndexOf('.')
        if (lastDotIndex === -1) continue

        const imdbId = filename.slice(0, lastDotIndex)
        if (imdbId.match(/^tt\d+$/)) {
          catalog.set(imdbId, filename)
        }
      }

      isCatalogLoaded = true
      console.log(`[Posters] Loaded ${catalog.size} posters from catalog`)
    } catch (err) {
      console.error('[Posters] Failed to load catalog:', err)
      isCatalogLoaded = false
    }
  })()

  return catalogLoadPromise
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve(data)
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

// Initialize catalog on module load
loadCatalog()

class PostersService {
  async getPostersByImdbIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return {}

    // Wait for the catalog. A failed load is retried here rather than being fatal
    // for the rest of the session.
    try {
      await loadCatalog()
      if (!isCatalogLoaded) {
        catalogLoadPromise = null
        await loadCatalog()
      }
    } catch (err) {
      console.error('[Posters] Failed to load catalog:', err)
      return {}
    }

    // Callers index the result by IMDb ID, so every path must return a plain object.
    if (!isCatalogLoaded || catalog.size === 0) {
      console.warn('[Posters] Catalog not loaded or empty, returning no posters')
      return {}
    }

    const result = {}

    for (const id of ids) {
      const filename = catalog.get(id)
      if (filename) {
        result[id] = `${BASE_IMAGE_URL}${filename}`
      }
    }

    return result
  }

  close() {
    // No resources to clean up for remote implementation
  }
}

export default new PostersService()
