import React from 'react'

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
          {videoFiles.map((file, index) => {
            const watched = isWatched(file.filename)
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
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
                <button
                  onClick={() => onPlay(file.link, file.filename)}
                  className="px-4 py-2 bg-accent hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Play in VLC
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FileUserInterface
