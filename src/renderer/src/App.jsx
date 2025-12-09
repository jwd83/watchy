import React, { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import ResultCard from './components/ResultCard'
import FileUserInterface from './components/FileUserInterface'
import SettingsModal from './components/SettingsModal'
import Library from './components/Library'
import History from './components/History'
import Toast from './components/Toast'

function App() {
  const [results, setResults] = useState([])
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [view, setView] = useState('search') // 'search', 'library', or 'history'
  const [savedSearches, setSavedSearches] = useState([])
  const [savedMagnets, setSavedMagnets] = useState([])
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState(null)
  const [currentMagnet, setCurrentMagnet] = useState(null) // { hash, title }

  useEffect(() => {
    window.api.getKey().then((key) => {
      if (!key) {
        setIsSettingsOpen(true)
      }
    })
    loadLibrary()
    loadHistory()
  }, [])

  const loadLibrary = async () => {
    const searches = await window.api.getSavedSearches()
    const magnets = await window.api.getSavedMagnets()
    setSavedSearches(searches)
    setSavedMagnets(magnets)
  }

  const loadHistory = async () => {
    const historyData = await window.api.getHistory()
    setHistory(historyData)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleSearch = async (query) => {
    setIsLoading(true)
    setResults([])
    setFiles([])
    setCurrentQuery(query)
    setView('search')
    setStatusMessage('Searching P2P networks...')
    try {
      const searchResults = await window.api.search(query)
      setResults(searchResults)
      if (searchResults.length === 0) {
        setStatusMessage('No results found.')
      } else {
        setStatusMessage('')
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Error searching.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSearch = async (query) => {
    const result = await window.api.addSavedSearch(query)
    if (result.success) {
      showToast(result.message)
      await loadLibrary()
    } else {
      showToast(result.message, 'error')
    }
  }

  const handleRemoveSearch = async (id) => {
    const result = await window.api.removeSavedSearch(id)
    showToast(result.message)
    await loadLibrary()
  }

  const handleSaveMagnet = async (result) => {
    const magnetData = {
      title: result.title,
      magnet: result.magnet,
      size: result.size,
      seeds: result.seeds,
      leeches: result.leeches
    }
    const response = await window.api.addSavedMagnet(magnetData)
    if (response.success) {
      showToast(response.message)
      await loadLibrary()
    } else {
      showToast(response.message, 'error')
    }
  }

  const handleRemoveMagnet = async (id) => {
    const result = await window.api.removeSavedMagnet(id)
    showToast(result.message)
    await loadLibrary()
  }

  const handleSelectResult = async (result) => {
    setIsLoading(true)
    setView('search') // Switch to search view to show files
    setStatusMessage(`Unlocking "${result.title}"...`)

    // Store current magnet context for history tracking
    setCurrentMagnet({
      hash: extractMagnetHash(result.magnet),
      title: result.title
    })

    try {
      const uploadResponse = await window.api.unlock(result.magnet)

      if (uploadResponse.status === 'success') {
        const magnetId = uploadResponse.data.magnets[0].id

        // Poll for status until ready (simplified for now, just check once or wait)
        // In a real app, we'd poll. For now, let's assume it might be instant or cached.
        // If it's not instant, we might need to wait.
        // Let's try to get files immediately.

        // Wait a second for AllDebrid to process
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const statusResponse = await window.api.getStatus(magnetId)
        if (statusResponse.status === 'success') {
          const magnetStatus = statusResponse.data.magnets // It returns an object or array?
          // The API returns { status: 'success', data: { magnets: { [id]: { ... } } } }
          // Or { data: { magnets: [ ... ] } } depending on endpoint.
          // Let's assume we can get the link if it's ready.

          if (magnetStatus.statusCode === 4) {
            // 4 = Ready
            // It's ready, but we need the links.
            // The 'links' array in status contains the downloadable links.
            const links = magnetStatus.links

            // We need to unlock these links to get the actual file stream URL
            // For simplicity, let's just take the first link and unlock it to see files?
            // Actually, AllDebrid 'unlock' on a link returns the file stream.

            // Let's just show the links and let user click?
            // No, we want to list files.

            // If we have links, we can unlock them.
            // Let's try to unlock the first link if available.
            if (links && links.length > 0) {
              const unlockedFiles = []
              for (const link of links) {
                const unlockRes = await window.api.getFiles(link.link)
                if (unlockRes.status === 'success') {
                  // unlockRes.data.link is the stream URL
                  unlockedFiles.push({
                    filename: unlockRes.data.filename,
                    link: unlockRes.data.link
                  })
                }
              }
              setFiles(unlockedFiles)
              setStatusMessage('Ready to play.')
            }
          } else {
            setStatusMessage(
              `Torrent is processing (Status: ${magnetStatus.status}). Please try again in a moment.`
            )
          }
        }
      } else {
        setStatusMessage('Failed to upload magnet.')
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Error unlocking torrent. Check API Key.')
    } finally {
      setIsLoading(false)
    }
  }

  const extractMagnetHash = (magnetLink) => {
    // Extract hash from magnet link (magnet:?xt=urn:btih:HASH&...)
    const match = magnetLink.match(/btih:([a-zA-Z0-9]+)/)
    return match ? match[1].toLowerCase() : magnetLink
  }

  const handlePlay = async (url, filename) => {
    window.api.play(url)

    // Record play in history if we have current magnet context
    if (currentMagnet) {
      await window.api.recordPlay(currentMagnet.hash, currentMagnet.title, filename, url)
      await loadHistory()
    }
  }

  const handleSaveSettings = async (key) => {
    await window.api.saveKey(key)
    setIsSettingsOpen(false)
  }

  const handleRemoveHistoryEntry = async (id) => {
    const result = await window.api.removeHistoryEntry(id)
    showToast(result.message)
    await loadHistory()
  }

  const handleRemoveAllHistory = async () => {
    const result = await window.api.removeAllHistory()
    showToast(result.message)
    await loadHistory()
  }

  const handleResetFileWatched = async (historyId, filename) => {
    const result = await window.api.resetFileWatched(historyId, filename)
    showToast(result.message)
    await loadHistory()
  }

  const handleViewMagnetFromHistory = (magnetHash, magnetTitle) => {
    // Reconstruct magnet link from hash
    const magnetLink = `magnet:?xt=urn:btih:${magnetHash}`
    const result = {
      magnet: magnetLink,
      title: magnetTitle
    }
    handleSelectResult(result)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Sticky top navigation for easy access while scrolling */}
        <div className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-background pb-4">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Watchy
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setView('search')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'search'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setView('library')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'library'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Library
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                view === 'history'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              History
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {view === 'history' ? (
          <History
            history={history}
            onRemoveEntry={handleRemoveHistoryEntry}
            onRemoveAll={handleRemoveAllHistory}
            onResetFile={handleResetFileWatched}
            onPlayFile={(url) => window.api.play(url)}
            onViewMagnet={handleViewMagnetFromHistory}
          />
        ) : view === 'library' ? (
          <Library
            savedSearches={savedSearches}
            savedMagnets={savedMagnets}
            onSearchSelect={handleSearch}
            onMagnetSelect={handleSelectResult}
            onRemoveSearch={handleRemoveSearch}
            onRemoveMagnet={handleRemoveMagnet}
          />
        ) : (
          <>
            <SearchBar
              onSearch={handleSearch}
              onSaveSearch={handleSaveSearch}
              isLoading={isLoading}
              currentQuery={currentQuery}
            />

            {statusMessage && (
              <div className="text-center text-gray-400 mb-8 animate-pulse">{statusMessage}</div>
            )}

            {files.length > 0 ? (
              <div>
                <button
                  onClick={() => {
                    setFiles([])
                    setStatusMessage('')
                  }}
                  className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
                >
                  {results.length > 0 ? '← Back to results' : '← Back to search'}
                </button>
                <FileUserInterface
                  files={files}
                  onPlay={handlePlay}
                  watchedFiles={
                    currentMagnet
                      ? history
                          .find((h) => h.magnetHash === currentMagnet.hash)
                          ?.files.map((f) => f.filename) || []
                      : []
                  }
                />
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((result, index) => (
                  <ResultCard
                    key={index}
                    result={result}
                    onSelect={handleSelectResult}
                    onSave={handleSaveMagnet}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  )
}

export default App
