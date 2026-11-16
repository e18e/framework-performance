import type { TableEntry } from '../../testdata/src/ssr.ts'
import {
  galleryStyleText,
  posterStyleText,
  getSSRImages,
  type SSRImageFormat,
} from '../../testdata/src/ssr-images.ts'

export function renderSSRImageHtml(format: SSRImageFormat): string {
  const images = getSSRImages(format)
    .map(({ src, alt, width, height, fetchPriority }) => {
      const priority = fetchPriority ? ` fetchpriority="${fetchPriority}"` : ''
      return `<img style="${posterStyleText}" src="${src}" alt="${alt}" width="${width}" height="${height}"${priority}>`
    })
    .join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SSR Image Benchmark</title></head><body><main class="ssr-image-gallery" style="${galleryStyleText}">${images}</main></body></html>`
}

export function renderSSRThroughputHtml(entries: TableEntry[]): string {
  const rows = entries
    .map((entry) => `<tr><td>${entry.id}</td><td>${entry.name}</td></tr>`)
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Baseline HTML SSR Throughput</title></head><body><table><tbody>${rows}</tbody></table></body></html>`
}

export function renderBaselineHtml(entries: TableEntry[]): string {
  const rows = entries
    .map(
      (entry) =>
        `<tr><td>${entry.id}</td><td>${entry.name}</td><td><a href="/server-side-rendered/${entry.id}">View →</a></td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Baseline HTML</title></head><body><table><tbody>${rows}</tbody></table></body></html>`
}
