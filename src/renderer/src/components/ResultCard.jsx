import React from 'react'

const ResultCard = ({ result, canonicalTitle, onSelect, onSave }) => {
  const primaryTitle = canonicalTitle || result.title
  const subtitle = canonicalTitle ? result.title : null

  return (
    <div className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary hover:bg-gray-700/50 transition-all hover:shadow-xl group">
      <div className="flex items-start gap-4">
        <button onClick={() => onSelect(result)} className="flex-1 min-w-0 text-left">
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary truncate" title={primaryTitle}>
            {primaryTitle}
          </h3>
          {subtitle && (
            <div className="text-xs text-gray-400 mb-1 truncate" title={subtitle}>
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
          className="flex-shrink-0 p-2 text-gray-400 hover:text-primary transition-colors"
          title="Save to library"
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
    </div>
  )
}

export default ResultCard
