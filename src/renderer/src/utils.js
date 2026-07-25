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

/** Extensions we treat as playable video. */
export const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'wmv']

export const isVideoFile = (filename) =>
  VIDEO_EXTENSIONS.includes(
    String(filename || '')
      .split('.')
      .pop()
      .toLowerCase()
  )

/** Download completion ratio in [0, 1]; 0 when the total size is unknown. */
export const downloadRatio = ({ receivedBytes, totalBytes }) => {
  if (!totalBytes || totalBytes <= 0) return 0
  return Math.min(1, Math.max(0, receivedBytes / totalBytes))
}
