import { html, type Html } from '@mastrojs/mastro'

export function Layout({ title, children }: { title: string; children: Html }) {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>${title}</title>
      </head>
      <body>
        ${children}
      </body>
    </html>`
}
