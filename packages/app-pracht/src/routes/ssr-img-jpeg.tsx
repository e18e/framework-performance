import {
  galleryStyle,
  posterStyle,
  getSSRImages,
} from '../../../testdata/src/ssr-images'

export function Component() {
  return (
    <main class="ssr-image-gallery" style={galleryStyle}>
      {getSSRImages('jpeg').map(({ fetchPriority, ...image }) => (
        <img
          style={posterStyle}
          key={image.src}
          {...image}
          fetchpriority={fetchPriority}
        />
      ))}
    </main>
  )
}
