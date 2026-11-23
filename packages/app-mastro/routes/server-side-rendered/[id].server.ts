import { html, htmlToResponse, type Handler } from '@mastrojs/mastro'
import { Layout } from '../../components/Layout.ts'

export const GET: Handler = (_req, { params }) =>
  htmlToResponse(
    Layout({
      title: 'Mastro Server Side Rendered Detail',
      children: html`<p id="detail-id">${params.id}</p>`,
    }),
  )
