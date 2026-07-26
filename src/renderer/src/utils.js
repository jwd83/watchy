// Shared renderer helpers.

/** Last path segment, tolerating both separators since we build paths with '/'. */
export const basename = (p) => {
  if (!p) return ''
  return String(p).split('/').pop().split('\\').pop()
}

/** Last path segment with its extension stripped. */
export const basenameWithoutExt = (p) => {
  const base = basename(p)
  const lastDot = base.lastIndexOf('.')
  return lastDot > 0 ? base.substring(0, lastDot) : base
}

/**
 * History entries hold either the full path or just the basename, depending on which
 * AllDebrid path recorded them. Returns a predicate that matches either form so a file
 * recorded one way is still recognised when listed the other way.
 */
export const watchedMatcher = (watchedFilenames = []) => {
  const seen = new Set(watchedFilenames.flatMap((f) => [f, basename(f)]))
  return (filename) => seen.has(filename) || seen.has(basename(filename))
}

/** Extensions we treat as playable video. */
export const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'wmv']

export const isVideoFile = (filename) =>
  VIDEO_EXTENSIONS.includes(
    String(filename || '')
      .split('.')
      .pop()
      .toLowerCase()
  )

/** Natural sort comparator for filenames with episode numbers (S01E02 before S01E10). */
export const naturalSortByFilename = (a, b) =>
  String(a?.filename || '').localeCompare(String(b?.filename || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  })

/**
 * The playable files of a magnet, in the order the UI lists them. Anything that isn't a
 * video (.txt, .nfo, subtitles, ...) is dropped, so "next" can never resolve to a
 * non-playable file, and the order matches what the file list shows.
 */
export const playableFiles = (files = []) =>
  files.filter((f) => isVideoFile(f.filename)).sort(naturalSortByFilename)

/** Download completion ratio in [0, 1]; 0 when the total size is unknown. */
export const downloadRatio = ({ receivedBytes, totalBytes }) => {
  if (!totalBytes || totalBytes <= 0) return 0
  return Math.min(1, Math.max(0, receivedBytes / totalBytes))
}
