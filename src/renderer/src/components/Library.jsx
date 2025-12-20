import React, { useMemo, useState } from 'react'

const Library = ({
  savedSearches,
  savedMagnets,
  onSearchSelect,
  onMagnetSelect,
  onRemoveSearch,
  onRemoveMagnet
}) => {
  const [filter, setFilter] = useState('')

  const normalizedFilter = filter.trim().toLowerCase()

  const sortedSavedSearches = useMemo(
    () =>
      [...savedSearches].sort((a, b) =>
        a.query.localeCompare(b.query, undefined, { sensitivity: 'base' })
      ),
    [savedSearches]
  )

  const sortedSavedMagnets = useMemo(
    () =>
      [...savedMagnets].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      ),
    [savedMagnets]
  )

  const filteredSearches = normalizedFilter
    ? sortedSavedSearches.filter((s) =>
        s.query.toLowerCase().includes(normalizedFilter)
      )
    : sortedSavedSearches

  const filteredMagnets = normalizedFilter
    ? sortedSavedMagnets.filter((item) =>
        (item.title && item.title.toLowerCase().includes(normalizedFilter))
      )
    : sortedSavedMagnets

  return (
    <div className="space-y-8">
      {/* Library filter */}
      <div className="flex justify-end">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter saved searches and library..."
          className="w-full max-w-sm px-4 py-2 mb-2 bg-surface border border-gray-700 rounded-full text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Saved Searches */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Saved Searches</h2>
        {savedSearches.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No saved searches yet</p>
        ) : filteredSearches.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No searches match your filter</p>
        ) : (
          <div className="grid gap-3">
            {filteredSearches.map((search) => (
              <div
                key={search.id}
                className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary transition-all group flex justify-between items-center"
              >
                <button onClick={() => onSearchSelect(search.query)} className="flex-1 text-left">
                  <div className="text-lg group-hover:text-primary transition-colors">
                    {search.query}
                  </div>
                  <div className="text-sm text-gray-500">
                    Saved {new Date(search.savedAt).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => onRemoveSearch(search.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Magnets */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">My Library</h2>
        {savedMagnets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No saved items yet</p>
        ) : filteredMagnets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No items match your filter</p>
        ) : (
          <div className="grid gap-3">
            {filteredMagnets.map((item) => (
              <div
                key={item.id}
                className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary transition-all group"
              >
                <div className="flex justify-between items-start">
                  <button onClick={() => onMagnetSelect(item)} className="flex-1 text-left">
                    <h3
                      className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors truncate"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <div className="flex justify-between text-sm text-gray-400">
                      <div className="flex gap-4">
                        <span className="text-green-400">↑ {item.seeds}</span>
                        <span className="text-red-400">↓ {item.leeches}</span>
                      </div>
                      <span>{item.size}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Added {new Date(item.savedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={() => onRemoveMagnet(item.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove from library"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Library
