import { useEffect, useMemo, useState } from 'react'

const DownloadManager = ({ downloads, variant = 'overlay', hidden = false, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  const isOverlay = variant === 'overlay'

  const activeCount = useMemo(() => {
    return downloads.filter((d) => d.state === 'progressing').length
  }, [downloads])

  const queuedCount = useMemo(() => {
    return downloads.filter((d) => d.state === 'queued').length
  }, [downloads])

  useEffect(() => {
    // For the page view, render as a normal section; no overlay transitions needed.
    if (!isOverlay) return

    if (hidden || downloads.length === 0) {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 300) // Wait for fade out
      return () => clearTimeout(timer)
    }

    setShouldRender(true)
    // Small timeout to ensure render happens before active class for transition
    requestAnimationFrame(() => setIsVisible(true))

    const allComplete = downloads.every((d) => d.state === 'completed' || d.state === 'failed')

    if (allComplete && downloads.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 4000) // 4 seconds delay
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [downloads, hidden, isOverlay])

  if (isOverlay && (!shouldRender && !isVisible)) return null

  if (!isOverlay) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Downloads</h2>
          <span className="text-sm text-gray-400">
            {downloads.length === 0
              ? 'No downloads yet'
              : `${activeCount} active${queuedCount > 0 ? ` • ${queuedCount} queued` : ''} • ${downloads.length} total`}
          </span>
        </div>

        {downloads.length === 0 ? (
          <div className="text-gray-400 text-sm">Start a download to see progress here.</div>
        ) : (
          <div className="space-y-2">
            {downloads.map((download) => (
              <div
                key={download.filename}
                className="p-3 bg-background rounded-lg border border-gray-700/60"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-200 truncate pr-2" title={download.filename}>
                    {download.filename}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {download.state === 'completed'
                      ? 'Done'
                      : download.state === 'failed'
                        ? 'Failed'
                        : download.state === 'queued'
                          ? 'Queued'
                          : `${Math.round((download.receivedBytes / download.totalBytes) * 100)}%`}
                  </span>
                </div>

                {download.state === 'progressing' && (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(download.receivedBytes / download.totalBytes) * 100}%` }}
                    />
                  </div>
                )}
                {download.state === 'queued' && (
                  <div className="text-xs text-yellow-500 mt-1">
                    Waiting for slot (max 3 concurrent)
                  </div>
                )}
                {download.state === 'completed' && (
                  <div className="text-xs text-green-500 mt-1">Download complete</div>
                )}
                {download.state === 'completed' && download.savePath && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => window.api.openFolder(download.savePath)}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      📁 Open Folder
                    </button>
                    <button
                      type="button"
                      onClick={() => window.api.playFile(download.savePath)}
                      className="text-xs px-2 py-1 bg-accent hover:bg-accent/80 rounded transition-colors"
                    >
                      ▶️ Play in VLC
                    </button>
                  </div>
                )}
                {download.state === 'failed' && (
                  <div className="text-xs text-red-500 mt-1">Download failed</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Overlay variant
  return (
    <div
      className={`fixed bottom-4 right-4 w-80 bg-surface border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 transition-all duration-300 ease-in-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-white">Downloads</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {activeCount} active{queuedCount > 0 ? ` • ${queuedCount} queued` : ''}
          </span>
          <button
            type="button"
            onClick={() => onDismiss?.()}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Hide downloads"
            title="Hide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.707-10.707a1 1 0 00-1.414-1.414L10 7.172 8.707 5.879a1 1 0 10-1.414 1.414L8.586 8.586l-1.293 1.293a1 1 0 101.414 1.414L10 10l1.293 1.293a1 1 0 001.414-1.414L11.414 8.586l1.293-1.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {downloads.map((download) => (
          <div
            key={download.filename}
            className="p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-200 truncate pr-2" title={download.filename}>
                {download.filename}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {download.state === 'completed'
                  ? 'Done'
                  : download.state === 'failed'
                    ? 'Failed'
                    : download.state === 'queued'
                      ? 'Queued'
                      : `${Math.round((download.receivedBytes / download.totalBytes) * 100)}%`}
              </span>
            </div>
            {download.state === 'progressing' && (
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(download.receivedBytes / download.totalBytes) * 100}%` }}
                />
              </div>
            )}
            {download.state === 'queued' && (
              <div className="text-xs text-yellow-500 mt-1">
                Waiting for slot (max 3 concurrent)
              </div>
            )}
            {download.state === 'completed' && (
              <div className="text-xs text-green-500 mt-1">Download complete</div>
            )}
            {download.state === 'completed' && download.savePath && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => window.api.openFolder(download.savePath)}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  📁 Open Folder
                </button>
                <button
                  type="button"
                  onClick={() => window.api.playFile(download.savePath)}
                  className="text-xs px-2 py-1 bg-accent hover:bg-accent/80 rounded transition-colors"
                >
                  ▶️ Play in VLC
                </button>
              </div>
            )}
            {download.state === 'failed' && (
              <div className="text-xs text-red-500 mt-1">Download failed</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DownloadManager
