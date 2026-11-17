import Image from 'next/image'
import { connection } from 'next/server'
import '../../../testdata/src/ssr-images.css'

export const instant = false

export default async function SSRImagePage() {
  await connection()
  return (
    <main className="ssr-image-gallery">
      <Image
        src="/ssr-images/BTTF1.jpg"
        alt="Back to the Future poster"
        width={667}
        height={987}
        loading="eager"
      />
      <Image
        src="/ssr-images/BTTF2.jpg"
        alt="Back to the Future Part II poster"
        width={667}
        height={1000}
        loading="eager"
        fetchPriority="high"
      />
      <Image
        src="/ssr-images/BTTF3.jpg"
        alt="Back to the Future Part III poster"
        width={667}
        height={999}
        loading="eager"
      />
    </main>
  )
