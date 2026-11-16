import { connection } from 'next/server'
import {
  galleryStyle,
  posterStyle,
  getSSRImages,
} from '../../../testdata/src/ssr-images'

export const instant = false

export default async function SSRImagePage() {
  await connection()
  return (
    <main className="ssr-image-gallery" style={galleryStyle}>
      {getSSRImages('webp').map((image) => (
        <img style={posterStyle} key={image.src} {...image} />
      ))}
    </main>
  )
}
