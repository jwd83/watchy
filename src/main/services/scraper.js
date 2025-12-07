import { BrowserWindow } from 'electron'

const BASE_URL = 'https://1337x.to'

class ScraperService {
  async search(query) {
    console.log(`[Scraper] Searching for: ${query}`)
    let win = null

    try {
      // Create a hidden window
      win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
          offscreen: true,
          sandbox: false
        }
      })

      const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}/1/`
      console.log(`[Scraper] Loading URL: ${searchUrl}`)

      await win.loadURL(searchUrl)

      // Wait for Cloudflare or page load
      // We can wait for a specific selector that indicates success
      // 1337x usually shows a table with class 'table-list'
      // Or if it's a challenge, the browser will handle it (mostly)
      // We might need to wait a bit more if there is a challenge.

      // Let's try to execute script to get results
      const results = await win.webContents.executeJavaScript(`
        (function() {
          const rows = document.querySelectorAll('table.table-list tbody tr');
          const data = [];
          rows.forEach(row => {
            const nameLinks = row.querySelectorAll('.name a');
            if (nameLinks.length < 2) return;
            
            const title = nameLinks[1].innerText;
            const link = nameLinks[1].href; // Absolute URL
            const seeds = row.querySelector('.seeds')?.innerText || '0';
            const leeches = row.querySelector('.leeches')?.innerText || '0';
            const size = row.querySelector('.size')?.childNodes[0]?.textContent || '';
            
            data.push({
              title,
              link,
              seeds: parseInt(seeds),
              leeches: parseInt(leeches),
              size
            });
          });
          return data;
        })();
      `)

      console.log(`[Scraper] Found ${results.length} initial results`)

      // Now get magnets for top 5
      // We can reuse the window to load each page
      const finalResults = []

      for (const result of results.slice(0, 5)) {
        try {
          console.log(`[Scraper] Fetching magnet for: ${result.title}`)
          await win.loadURL(result.link)

          const magnet = await win.webContents.executeJavaScript(`
            document.querySelector('a[href^="magnet:"]')?.href
          `)

          if (magnet) {
            finalResults.push({ ...result, magnet })
          }
        } catch (e) {
          console.error(`[Scraper] Failed to get magnet for ${result.title}:`, e.message)
        }
      }

      console.log(`[Scraper] Returning ${finalResults.length} results with magnets`)
      return finalResults
    } catch (error) {
      console.error('Scraper search error:', error)
      return []
    } finally {
      if (win) {
        win.destroy()
      }
    }
  }
}

export default new ScraperService()
