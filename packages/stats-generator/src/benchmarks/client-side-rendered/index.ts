import { measurementsConfig } from '../../measurements.ts'
import type { FrameworkConfig, TestConfig } from '../../types.ts'
import { startBenchmarkServer } from '../../benchmark-server.ts'
import { getHost } from '../../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { ClientSideRenderedBenchmarkResult } from './types.ts'

const CLIENT_SIDE_RENDERED_HOST = getHost()
const CLIENT_SIDE_RENDERED_PORT = 3001

export async function runClientSideRenderedBenchmark(
  framework: FrameworkConfig,
  app: TestConfig,
): Promise<ClientSideRenderedBenchmarkResult> {
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${app.package}`)
  }

  const name = `${app.benchmarkName ?? framework.name}-client-side-rendered`
  const displayName = `${framework.displayName} Client Side Rendered`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: app.package, serveScript: app.serveScript },
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
    await killServer()
  }
}
