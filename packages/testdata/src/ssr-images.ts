export type SSRImageFormat = 'jpeg' | 'webp'

export const galleryStyle = {
  display: 'grid',
  grid: 'auto / repeat(3, minmax(0, 1fr))',
  gap: '1rem',
  width: 'min(100%, 75rem)',
  margin: '1rem auto',
}

export const posterStyle = {
  display: 'block',
  width: '100%',
  height: 'auto',
}

function serializeStyle(style: Record<string, string>) {
  return Object.entries(style)
    .map(([property, value]) => `${property}:${value}`)
    .join(';')
}

export const galleryStyleText = serializeStyle(galleryStyle)
export const posterStyleText = serializeStyle(posterStyle)

const posters = [
  { name: 'BTTF1', alt: 'Back to the Future poster', width: 667, height: 987 },
  {
    name: 'BTTF2',
    alt: 'Back to the Future Part II poster',
    width: 667,
    height: 1000,
  },
  {
    name: 'BTTF3',
    alt: 'Back to the Future Part III poster',
    width: 667,
    height: 999,
  },
] as const

export function getSSRImages(format: SSRImageFormat) {
  const extension = format === 'jpeg' ? 'jpg' : 'webp'

  return posters.map(({ name, alt, width, height }, index) => ({
    src: `/ssr-images/${name}.${extension}`,
    alt,
    width,
    height,
    // The second poster is the tallest when all three columns have equal width.
    fetchPriority: index === 1 ? ('high' as const) : undefined,
  }))
}
