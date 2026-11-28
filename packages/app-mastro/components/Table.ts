import { html } from '@mastrojs/mastro'
import type { TableEntry } from '../../testdata/src/ssr.ts'

export function Table(entries: TableEntry[], links: boolean) {
  return html`<table>
    <tbody>
      ${entries.map(
        (entry) =>
          html`<tr>
            <td>${entry.id}</td>
            <td>${entry.name}</td>
            ${links ? html`<td><a href="/server-side-rendered/${entry.id}">View →</a></td>` : html``}
          </tr>`,
      )}
    </tbody>
  </table>`
}
