import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { getSSRImages } from '../../../testdata/src/ssr-images.ts'
import { testData } from '../../../testdata/src/ssr.ts'
import { renderBaselineHtml, renderSSRImageHtml } from '../baseline-html.ts'
import { getHost, getPort, registerShutdown } from './common.ts'

const HOST = getHost()
const PORT = getPort()

const galleryAssets = new Map<string, string>([
  ...getSSRImages('jpeg').map(({ src }): [string, string] => [
    src,
    'image/jpeg',
  ]),
  ...getSSRImages('webp').map(({ src }): [string, string] => [
    src,
    'image/webp',
  ]),
])
const galleryAssetDirectory = new URL(
  '../../../app-baseline-html/public/',
  import.meta.url,
)

const server = createServer(async (req, res) => {
  const pathname = req.url?.split('?')[0] ?? '/'
  if (pathname === '/ssr-img-jpeg' || pathname === '/ssr-img-webp') {
    const format = pathname === '/ssr-img-jpeg' ? 'jpeg' : 'webp'
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderSSRImageHtml(format))
    return
  }

  const contentType = galleryAssets.get(pathname)
  if (contentType) {
    try {
      const asset = await readFile(
        new URL(pathname.slice(1), galleryAssetDirectory),
      )
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': asset.length,
      })
      res.end(asset)
    } catch {
      res.writeHead(500)
      res.end()
    }
    return
  }

  const entries = await testData()
  const html = renderBaselineHtml(entries)

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}).listen(PORT, HOST, () => {
  console.log(`Ready at http://${HOST}:${PORT}`)
})

registerShutdown(server)
