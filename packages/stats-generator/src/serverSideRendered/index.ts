import { measurementsConfig } from '../measurements.ts'
import { getFrameworks } from '../get-frameworks.ts'
import { startBenchmarkServer } from '../benchmark-server.ts'
import { getHost } from '../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { ServerSideRenderedBenchmarkResult } from './types.ts'

const SERVER_SIDE_RENDERED_HOST = getHost()
const SERVER_SIDE_RENDERED_PORT = 3002

export async function runServerSideRenderedBenchmark(
  packageName: string,
): Promise<ServerSideRenderedBenchmarkResult> {
  const frameworks = (await getFrameworks()).filter(({ measurements }) =>
    measurements.includes('ssrLighthouse'),
  )
  const framework = frameworks.find(({ app }) => app?.package === packageName)
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown server side rendered package: ${packageName}. Available: ${frameworks.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${packageName}`)
  }

  const name = `${app.benchmarkName ?? framework.name}-server-side-rendered`
  const displayName = `${framework.displayName} Server Side Rendered`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: packageName, serveScript: app.serveScript },
    {
      host: SERVER_SIDE_RENDERED_HOST,
      port: SERVER_SIDE_RENDERED_PORT,
      readinessPath: measurementsConfig.ssrLighthouse.path,
    },
  )

  try {
    console.info(`Running server side rendered benchmark for ${displayName}...`)
    return await runBenchmark(
      `http://${SERVER_SIDE_RENDERED_HOST}:${SERVER_SIDE_RENDERED_PORT}`,
      name,
      displayName,
      app.fullDocumentNavigation ?? false,
    )
  } finally {
    killServer()
  }
}
