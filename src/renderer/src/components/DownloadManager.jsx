
const DownloadManager = ({ downloads }) => {
    if (downloads.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-surface border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Downloads</h3>
                <span className="text-xs text-gray-400">{downloads.length} active</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {downloads.map((download) => (
                    <div key={download.filename} className="p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-200 truncate pr-2" title={download.filename}>
                                {download.filename}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                {download.state === 'completed'
                                    ? 'Done'
                                    : download.state === 'failed'
                                        ? 'Failed'
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
                        {download.state === 'completed' && <div className="text-xs text-green-500 mt-1">Download complete</div>}
                        {download.state === 'failed' && <div className="text-xs text-red-500 mt-1">Download failed</div>}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DownloadManager
