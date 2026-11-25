import type { FrameworkConfig, TestConfig } from '../types.ts'
import { startBenchmarkServer } from '../benchmark-server.ts'
import { getHost } from '../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'

const INITIAL_LOAD_HOST = getHost()
const INITIAL_LOAD_PORT = 3003

export async function runInitialLoadBenchmark(
  framework: FrameworkConfig,
  app: TestConfig,
  path: string,
) {
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${app.package}`)
  }

  console.info(`Starting server for ${framework.displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: app.package, serveScript: app.serveScript },
    {
      host: INITIAL_LOAD_HOST,
      port: INITIAL_LOAD_PORT,
      readinessPath: path,
    },
  )

  try {
    console.info(
      `Running initial load benchmark for ${framework.displayName}...`,
    )
    return await runBenchmark(
      `http://${INITIAL_LOAD_HOST}:${INITIAL_LOAD_PORT}${path}`,
    )
  } finally {
    killServer()
  }
}
