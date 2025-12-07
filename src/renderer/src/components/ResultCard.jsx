import React from 'react';

const ResultCard = ({ result, onSelect }) => {
    return (
        <div
            onClick={() => onSelect(result)}
            className="bg-surface p-4 rounded-xl border border-gray-700 hover:border-primary cursor-pointer transition-all hover:shadow-xl group"
        >
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary truncate" title={result.title}>
                {result.title}
            </h3>
            <div className="flex justify-between text-sm text-gray-400">
                <div className="flex gap-4">
                    <span className="text-green-400">↑ {result.seeds}</span>
                    <span className="text-red-400">↓ {result.leeches}</span>
                </div>
                <span>{result.size}</span>
            </div>
        </div>
    );
};

export default ResultCard;
