import { measurementsConfig } from '@framework-performance/results/measurements-config'
import type { FrameworkConfig, TestConfig } from '../../types.ts'
import { startBenchmarkServer } from '../../app-servers/benchmark-server.ts'
import { getHost } from '../../app-servers/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { ServerSideRenderedBenchmarkResult } from './types.ts'

const SERVER_SIDE_RENDERED_HOST = getHost()
const SERVER_SIDE_RENDERED_PORT = 3002

export async function runServerSideRenderedBenchmark(
  framework: FrameworkConfig,
  app: TestConfig,
): Promise<ServerSideRenderedBenchmarkResult> {
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${app.package}`)
  }

  const name = `${app.benchmarkName ?? framework.name}-server-side-rendered`
  const displayName = `${framework.displayName} Server Side Rendered`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: app.package, serveScript: app.serveScript },
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
    await killServer()
  }
}
