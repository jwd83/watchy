import React from 'react'

const FileUserInterface = ({ files, onPlay }) => {
  // Filter for video files
  const videoFiles = files.filter((f) => {
    const ext = f.filename.split('.').pop().toLowerCase()
    return ['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)
  })

  return (
    <div className="mt-8 bg-surface rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Available Files</h2>
      {videoFiles.length === 0 ? (
        <p className="text-gray-400">No video files found in this torrent.</p>
      ) : (
        <div className="space-y-2">
          {videoFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="truncate flex-1 mr-4">{file.filename}</span>
              <button
                onClick={() => onPlay(file.link)} // Assuming 'link' is the direct download link
                className="px-4 py-2 bg-accent hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Play in VLC
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUserInterface
