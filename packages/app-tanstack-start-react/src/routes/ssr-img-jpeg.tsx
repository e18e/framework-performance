import { createFileRoute } from '@tanstack/react-router'
import {
  galleryStyle,
  posterStyle,
  getSSRImages,
} from '../../../testdata/src/ssr-images'

export const Route = createFileRoute('/ssr-img-jpeg')({
  component: SSRImagePage,
})

function SSRImagePage() {
  return (
    <main className="ssr-image-gallery" style={galleryStyle}>
      {getSSRImages('jpeg').map((image) => (
        <img style={posterStyle} key={image.src} {...image} />
      ))}
    </main>
  )
}
