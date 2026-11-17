import { measurementsConfig } from '../measurements.ts'
import { getFrameworks } from '../get-frameworks.ts'
import { startBenchmarkServer } from '../benchmark-server.ts'
import { getHost } from '../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { InitialLoadResult } from '@framework-performance/results'

const INITIAL_LOAD_HOST = getHost()
const INITIAL_LOAD_PORT = 3003

export async function runInitialLoadBenchmark(
  packageName: string,
): Promise<InitialLoadResult> {
  const frameworks = (await getFrameworks()).filter(({ app }) =>
    app?.measurements.includes('initialLoad'),
  )
  const framework = frameworks.find(({ app }) => app?.package === packageName)
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown initial load package: ${packageName}. Available: ${frameworks.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${packageName}`)
  }

  console.info(`Starting server for ${framework.displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: packageName, serveScript: app.serveScript },
    {
      host: INITIAL_LOAD_HOST,
      port: INITIAL_LOAD_PORT,
      readinessPath: measurementsConfig.initialLoad.path,
    },
  )

  try {
    console.info(
      `Running initial load benchmark for ${framework.displayName}...`,
    )
    return await runBenchmark(
      `http://${INITIAL_LOAD_HOST}:${INITIAL_LOAD_PORT}`,
    )
  } finally {
    killServer()
  }
}
