import React, { useState } from 'react';

const SearchBar = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

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
                <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-primary hover:bg-blue-600 text-white rounded-full font-medium transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </form>
    );
};

export default SearchBar;
