import { connection } from 'next/server'
import '../../../testdata/src/ssr-images.css'

export const instant = false

export default async function SSRImagePage() {
  await connection()
  return (
    <main className="ssr-image-gallery">
      <img
        src="/ssr-images/BTTF1.jpg"
        alt="Back to the Future poster"
        width={667}
        height={987}
      />
      <img
        src="/ssr-images/BTTF2.jpg"
        alt="Back to the Future Part II poster"
        width={667}
        height={1000}
        fetchPriority="high"
      />
      <img
        src="/ssr-images/BTTF3.jpg"
        alt="Back to the Future Part III poster"
        width={667}
        height={999}
      />
    </main>
  )
}
