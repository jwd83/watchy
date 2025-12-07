import Store from 'electron-store'

const store = new Store()

class LibraryService {
  // Saved Searches
  getSavedSearches() {
    return store.get('savedSearches', [])
  }

  addSavedSearch(searchQuery) {
    const searches = this.getSavedSearches()
    const existing = searches.find((s) => s.query === searchQuery)
    if (existing) {
      return { success: false, message: 'Search already saved' }
    }
    searches.unshift({
      id: Date.now().toString(),
      query: searchQuery,
      savedAt: new Date().toISOString()
    })
    store.set('savedSearches', searches)
    return { success: true, message: 'Search saved' }
  }

  removeSavedSearch(id) {
    const searches = this.getSavedSearches()
    const filtered = searches.filter((s) => s.id !== id)
    store.set('savedSearches', filtered)
    return { success: true, message: 'Search removed' }
  }

  // Saved Magnets (Library Items)
  getSavedMagnets() {
    return store.get('savedMagnets', [])
  }

  addSavedMagnet(magnetData) {
    const magnets = this.getSavedMagnets()
    const existing = magnets.find((m) => m.magnet === magnetData.magnet)
    if (existing) {
      return { success: false, message: 'Already in library' }
    }
    magnets.unshift({
      id: Date.now().toString(),
      title: magnetData.title,
      magnet: magnetData.magnet,
      size: magnetData.size,
      seeds: magnetData.seeds,
      leeches: magnetData.leeches,
      savedAt: new Date().toISOString()
    })
    store.set('savedMagnets', magnets)
    return { success: true, message: 'Added to library' }
  }

  removeSavedMagnet(id) {
    const magnets = this.getSavedMagnets()
    const filtered = magnets.filter((m) => m.id !== id)
    store.set('savedMagnets', filtered)
    return { success: true, message: 'Removed from library' }
  }
}

export default new LibraryService()
