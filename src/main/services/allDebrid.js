import axios from 'axios';
import Store from 'electron-store';

const store = new Store();
const BASE_URL = 'https://api.alldebrid.com/v4';

class AllDebridService {
  constructor() {
    this.agent = 'watchy-app';
  }

  get apiKey() {
    return store.get('alldebrid_api_key');
  }

  async setApiKey(key) {
    store.set('alldebrid_api_key', key);
  }

  async uploadMagnet(magnet) {
    if (!this.apiKey) throw new Error('API Key not set');
    try {
      const response = await axios.get(`${BASE_URL}/magnet/upload`, {
        params: { agent: this.agent, apikey: this.apiKey, magnets: magnet }
      });
      return response.data;
    } catch (error) {
      console.error('AllDebrid uploadMagnet error:', error);
      throw error;
    }
  }

  async getStatus(id) {
    if (!this.apiKey) throw new Error('API Key not set');
    try {
      const response = await axios.get(`${BASE_URL}/magnet/status`, {
        params: { agent: this.agent, apikey: this.apiKey, id }
      });
      return response.data;
    } catch (error) {
      console.error('AllDebrid getStatus error:', error);
      throw error;
    }
  }

  async unlockLink(link) {
    if (!this.apiKey) throw new Error('API Key not set');
    try {
      const response = await axios.get(`${BASE_URL}/link/unlock`, {
        params: { agent: this.agent, apikey: this.apiKey, link }
      });
      return response.data;
    } catch (error) {
      console.error('AllDebrid unlockLink error:', error);
      throw error;
    }
  }
}

export default new AllDebridService();

