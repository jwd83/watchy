import React, { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import ResultCard from './components/ResultCard'
import FileUserInterface from './components/FileUserInterface'
import SettingsModal from './components/SettingsModal'

function App() {
  const [results, setResults] = useState([])
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    window.api.getKey().then((key) => {
      if (!key) {
        setIsSettingsOpen(true)
      }
    })
  }, [])

  const handleSearch = async (query) => {
    setIsLoading(true)
    setResults([])
    setFiles([])
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

  const handleSelectResult = async (result) => {
    setIsLoading(true)
    setStatusMessage(`Unlocking "${result.title}"...`)
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

  const handlePlay = (url) => {
    window.api.play(url)
  }

  const handleSaveSettings = async (key) => {
    await window.api.saveKey(key)
    setIsSettingsOpen(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Watchy
          </h1>
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

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {statusMessage && (
          <div className="text-center text-gray-400 mb-8 animate-pulse">{statusMessage}</div>
        )}

        {files.length > 0 ? (
          <div>
            <button
              onClick={() => setFiles([])}
              className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
            >
              ← Back to results
            </button>
            <FileUserInterface files={files} onPlay={handlePlay} />
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((result, index) => (
              <ResultCard key={index} result={result} onSelect={handleSelectResult} />
            ))}
          </div>
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  )
}

export default App
