import { useState, useEffect } from 'react'
import { usePosterPreview } from '../hooks/usePosterPreview'

function parseEpisodeInfo(title) {
  if (!title) return null
  const t = title.toUpperCase()

  // Complete series: "Season 1-5", "S01-S05", "Complete Series"
  if (/SEASON\s*\d+\s*[-–]\s*\d+|S\d{1,2}\s*[-–]\s*S?\d{1,2}|COMPLETE\s*SERIES/i.test(title)) {
    return 'Complete Series'
  }

  // Complete season: "Season 1", "S01" (but not followed by E)
  const seasonOnly = t.match(/\bS(\d{1,2})(?!\s*E)\b/) || title.match(/\bSEASON\s*(\d{1,2})\b/i)
  if (seasonOnly && !/S\d{1,2}\s*E\d/i.test(title)) {
    return `Season ${parseInt(seasonOnly[1], 10)}`
  }

  // Specific episode: "S01E05", "S1E5"
  const ep = title.match(/\bS(\d{1,2})\s*E(\d{1,2})\b/i)
  if (ep) {
    return `S${parseInt(ep[1], 10)}E${parseInt(ep[2], 10)}`
  }

  return null
}

const ResultCard = ({ result, canonicalTitle, imdbId, onSelect, onSave, isSaved }) => {
  const [posters, setPosters] = useState({})
  const { thumbnailProps, preview } = usePosterPreview(posters)

  const episodeInfo = canonicalTitle ? parseEpisodeInfo(result.title) : null
  const primaryTitle = canonicalTitle
    ? episodeInfo
      ? `${canonicalTitle} - ${episodeInfo}`
      : canonicalTitle
    : result.title
  const subtitle = canonicalTitle ? result.title : null

  useEffect(() => {
    if (imdbId) {
      window.api.getPosters([imdbId]).then(setPosters)
    }
  }, [imdbId])

  return (
    <div className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary hover:bg-gray-700/50 transition-all hover:shadow-xl group overflow-hidden">
      <div className="flex items-start gap-4">
        {imdbId && posters[imdbId] && (
          <img
            src={posters[imdbId]}
            alt={primaryTitle}
            className="w-12 h-16 object-cover rounded flex-shrink-0 cursor-zoom-in"
            {...thumbnailProps(imdbId)}
          />
        )}
        <button onClick={() => onSelect(result)} className="flex-1 min-w-0 text-left">
          <h3
            className="text-lg font-semibold mb-1 group-hover:text-primary truncate"
            title={primaryTitle}
          >
            {primaryTitle}
          </h3>
          {subtitle && (
            <div className="text-sm text-gray-400 mb-1 truncate" title={subtitle}>
              {subtitle}
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-400">
            <div className="flex gap-4">
              <span className="text-green-400">↑ {result.seeds}</span>
              <span className="text-red-400">↓ {result.leeches}</span>
            </div>
            <span>{result.size}</span>
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSave(result)
          }}
          className={`flex-shrink-0 p-2 transition-colors ${
            isSaved ? 'text-green-500' : 'text-gray-400 hover:text-primary'
          }`}
          title={isSaved ? 'Remove from library' : 'Save to library'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </button>
      </div>

      {preview}
    </div>
  )
}

export default ResultCard
