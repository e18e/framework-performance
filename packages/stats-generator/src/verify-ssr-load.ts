import { getFrameworks } from './get-frameworks.ts'
import { startSSRLoadServer } from './ssrLoad/index.ts'
import { getSSRLoadPath } from './ssrLoad/config.ts'
import { verifySSRLoadTable } from './ssrLoad/verify-table.ts'

// Validate production builds without measuring or writing benchmark results.
process.env.HOST = '127.0.0.1'
process.env.PORT = '3003'
process.env.SSR_LOAD_KIND = 'ssrLoad'
const selected = process.argv.slice(2)
for (const framework of await getFrameworks()) {
  const { app, measurements } = framework
  if (!app || !measurements.includes('ssrLoad')) continue
  if (selected.length && !selected.includes(framework.name)) continue
  const stop = await startSSRLoadServer(
    app,
    getSSRLoadPath(framework, 'ssrLoad'),
  )
  try {
    const kinds = measurements.includes('ssrLoadRouterLinks')
      ? (['ssrLoad', 'ssrLoadRouterLinks'] as const)
      : (['ssrLoad'] as const)
    for (const kind of kinds) {
      const path = getSSRLoadPath(framework, kind)
      const response = await fetch(`http://127.0.0.1:3003${path}`, {
        headers: { Accept: 'text/html' },
      })
      if (!response.ok)
        throw new Error(`${app.package} ${path}: HTTP ${response.status}`)
      verifySSRLoadTable(await response.text())
      console.info(
        `✓ ${app.package} ${path}: 1,000 rows, three columns, UUID data, View → links and detail destinations`,
      )
    }
  } finally {
    stop()
    // Allow the existing server wrapper to shut down its child before the next app.
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}
