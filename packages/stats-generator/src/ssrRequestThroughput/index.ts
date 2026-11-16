import { measurementsConfig } from '../measurements.ts'
import { runBenchmark } from './run-benchmark.ts'
import { frameworksConfig } from '../frameworks.ts'
import type { FrameworkConfig } from '../types.ts'
import type {
  ServerRenderHandler,
  SSRRequestThroughputBenchmarkResult,
} from './types.ts'

const frameworks: FrameworkConfig[] = frameworksConfig
const throughputFrameworks = frameworks.filter(({ app }) =>
  app?.measurements.includes('ssrRequestThroughput'),
)

export function supportsSSRRequestThroughputBenchmark(
  packageName: string,
): boolean {
  return throughputFrameworks.some(({ app }) => app?.package === packageName)
}

export async function runSSRRequestThroughputBenchmark(
  packageName: string,
  runs: number = measurementsConfig.ssrRequestThroughput.runs,
): Promise<SSRRequestThroughputBenchmarkResult> {
  const framework = throughputFrameworks.find(
    ({ app }) => app?.package === packageName,
  )
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown SSR request throughput package: ${packageName}. Available: ${throughputFrameworks.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  if (!app.throughputHandler) {
    throw new Error(
      `SSR request throughput handler is not configured for ${packageName}`,
    )
  }

  const name =
    framework.name === 'baseline-html'
      ? framework.name
      : `${app.benchmarkName ?? framework.name}-ssr-request-throughput`
  const displayName = `${framework.displayName} SSR Request Handler Throughput`

  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'

  try {
    const {
      buildHandler,
    }: {
      buildHandler: () => Promise<ServerRenderHandler>
    } = await import(`./handlers/${app.throughputHandler}`)
    const handler = await buildHandler()
    const results = await runBenchmark(
      [
        {
          name,
          displayName,
          package: packageName,
          handler,
        },
      ],
      runs,
    )

    return results[0]
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }
  }
}
