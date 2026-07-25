/** Large poster shown next to a hovered thumbnail. Positioned via `usePosterPreview`. */
const PosterPreview = ({ src, position }) => (
  <div className="fixed z-[100] pointer-events-none" style={position}>
    <img
      src={src}
      alt="Poster preview"
      className="w-48 h-72 object-cover rounded-lg shadow-2xl border border-gray-600"
    />
  </div>
)

export default PosterPreview
