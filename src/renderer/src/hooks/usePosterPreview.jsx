import { useState } from 'react'
import PosterPreview from '../components/PosterPreview'

/**
 * Shared "hover a thumbnail to see a large poster" behaviour, used by the search
 * suggestions, result cards and library list.
 *
 * Returns handlers to spread onto each thumbnail plus the preview element to render
 * alongside them.
 */
export const usePosterPreview = (posters) => {
  const [hoveredPoster, setHoveredPoster] = useState(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const thumbnailProps = (imdbId) => ({
    onMouseEnter: (e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setPosition({ top: rect.top, left: rect.right + 12 })
      setHoveredPoster(imdbId)
    },
    onMouseLeave: () => setHoveredPoster(null)
  })

  const preview =
    hoveredPoster && posters[hoveredPoster] ? (
      <PosterPreview src={posters[hoveredPoster]} position={position} />
    ) : null

  return { thumbnailProps, preview, hidePreview: () => setHoveredPoster(null) }
}
