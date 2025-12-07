import React, { useState } from 'react'

const SearchBar = ({ onSearch, onSaveSearch, isLoading, currentQuery }) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies, shows, or PBS broadcasts..."
          className="w-full px-6 py-4 text-lg bg-surface border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-lg transition-all"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-2 bottom-2 flex gap-2">
          {currentQuery && (
            <button
              type="button"
              onClick={() => onSaveSearch(currentQuery)}
              className="px-4 bg-surface hover:bg-gray-700 text-gray-300 rounded-full font-medium transition-colors flex items-center gap-2"
              title="Save this search"
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
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 bg-primary hover:bg-blue-600 text-white rounded-full font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default SearchBar
