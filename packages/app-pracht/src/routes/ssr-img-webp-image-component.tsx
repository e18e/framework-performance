import { Image } from '@pracht/image'
import '../../../testdata/src/ssr-images.css'

export function Component() {
  return (
    <main class="ssr-image-gallery">
      <Image
        src="/ssr-images/BTTF1.webp"
        alt="Back to the Future poster"
        width={667}
        height={987}
        loading="eager"
      />
      <Image
        src="/ssr-images/BTTF2.webp"
        alt="Back to the Future Part II poster"
        width={667}
        height={1000}
        priority
      />
      <Image
        src="/ssr-images/BTTF3.webp"
        alt="Back to the Future Part III poster"
        width={667}
        height={999}
        loading="eager"
      />
    </main>
  )
}
