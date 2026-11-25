import { measurementsConfig } from '../measurements.ts'
import { startBenchmarkServer } from '../benchmark-server.ts'
import { getFrameworks } from '../get-frameworks.ts'
import { getHost } from '../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { ClientSideRenderedBenchmarkResult } from './types.ts'

const CLIENT_SIDE_RENDERED_HOST = getHost()
const CLIENT_SIDE_RENDERED_PORT = 3001

export async function runClientSideRenderedBenchmark(
  packageName: string,
): Promise<ClientSideRenderedBenchmarkResult> {
  const frameworks = (await getFrameworks()).filter(({ measurements }) =>
    measurements.includes('csrLighthouse'),
  )
  const framework = frameworks.find(({ app }) => app?.package === packageName)
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown client-side rendered package: ${packageName}. Available: ${frameworks.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${packageName}`)
  }

  const name = `${app.benchmarkName ?? framework.name}-client-side-rendered`
  const displayName = `${framework.displayName} Client Side Rendered`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: packageName, serveScript: app.serveScript },
    {
      host: CLIENT_SIDE_RENDERED_HOST,
      port: CLIENT_SIDE_RENDERED_PORT,
      readinessPath: measurementsConfig.csrLighthouse.path,
    },
  )

  try {
    console.info(`Running client-side rendered benchmark for ${displayName}...`)
    return await runBenchmark(
      `http://${CLIENT_SIDE_RENDERED_HOST}:${CLIENT_SIDE_RENDERED_PORT}`,
      name,
      displayName,
      app.fullDocumentNavigation ?? false,
    )
  } finally {
    killServer()
  }
}
