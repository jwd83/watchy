const FileUserInterface = ({ files, onPlay, watchedFiles = [] }) => {
  // Filter for video files
  const videoFiles = files.filter((f) => {
    const ext = f.filename.split('.').pop().toLowerCase()
    return ['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)
  })

  const isWatched = (filename) => watchedFiles.includes(filename)

  return (
    <div className="mt-8 bg-surface rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Available Files</h2>
      {videoFiles.length === 0 ? (
        <p className="text-gray-400">No video files found in this torrent.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => {
                const links = videoFiles.map((f) => f.link).join('\n')
                navigator.clipboard.writeText(links)
              }}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Links
            </button>
            <button
              onClick={async () => {
                const folder = await window.api.selectFolder()
                if (folder) {
                  // Trigger downloads
                  files.forEach((file) => {
                    // Check extension again just in case, though videoFiles is filtered
                    const ext = file.filename.split('.').pop().toLowerCase()
                    if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)) {
                      window.api.download(file.link, { directory: folder })
                    }
                  })
                }
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download All
            </button>
          </div>
          {videoFiles.map((file, index) => {
            const watched = isWatched(file.filename)
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {watched && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      title="Watched"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className={`truncate ${watched ? 'text-gray-400' : ''}`}>
                    {file.filename}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onPlay(file.link, file.filename)}
                    className="px-4 py-2 bg-accent hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Play in VLC
                  </button>
                  <button
                    onClick={() => window.api.download(file.link)}
                    className="px-4 py-2 bg-surface hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 flex items-center gap-2 whitespace-nowrap"
                    title="Download File"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FileUserInterface
