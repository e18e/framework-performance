import { For } from 'solid-js'
import {
  galleryStyle,
  posterStyle,
  getSSRImages,
} from '../../../../testdata/src/ssr-images'

export default function SSRImagePage() {
  return (
    <main class="ssr-image-gallery" style={galleryStyle}>
      <For each={getSSRImages('jpeg')}>
        {({ fetchPriority, ...image }) => (
          <img style={posterStyle} {...image} fetchpriority={fetchPriority} />
        )}
      </For>
    </main>
  )
}
