import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://1337x.to';

class ScraperService {
  async search(query) {
    try {
      const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}/1/`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      const results = [];

      $('table.table-list tbody tr').each((i, element) => {
        const title = $(element).find('.name a').eq(1).text();
        const link = $(element).find('.name a').eq(1).attr('href');
        const seeds = $(element).find('.seeds').text();
        const leeches = $(element).find('.leeches').text();
        const size = $(element).find('.size').contents().first().text();
        
        if (title && link) {
          results.push({
            title,
            link: `${BASE_URL}${link}`,
            seeds: parseInt(seeds) || 0,
            leeches: parseInt(leeches) || 0,
            size
          });
        }
      });

      // Get magnet links for top results (limit to 5 to avoid spamming)
      const detailedResults = await Promise.all(
        results.slice(0, 5).map(async (result) => {
          try {
            const pageResponse = await axios.get(result.link);
            const $page = cheerio.load(pageResponse.data);
            const magnet = $page('a[href^="magnet:"]').first().attr('href');
            return { ...result, magnet };
          } catch (e) {
            return null;
          }
        })
      );

      return detailedResults.filter(r => r && r.magnet);
    } catch (error) {
      console.error('Scraper search error:', error);
      return [];
    }
  }
}

export default new ScraperService();

