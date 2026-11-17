import { measurementsConfig } from '../measurements.ts'
import { runBenchmark } from './run-benchmark.ts'
import { frameworksConfig } from '../frameworks.ts'
import { buildHandler as buildBaselineHtmlHandler } from './handlers/baseline-html.ts'
import { buildHandler as buildAstroHandler } from './handlers/astro.ts'
import { buildHandler as buildNextJSHandler } from './handlers/nextjs.ts'
import { buildHandler as buildNuxtHandler } from './handlers/nuxt.ts'
import { buildHandler as buildPrachtHandler } from './handlers/pracht.ts'
import { buildHandler as buildReactRouterHandler } from './handlers/react-router.ts'
import { buildHandler as buildSolidStartHandler } from './handlers/solid-start.ts'
import { buildHandler as buildSolidHandler } from './handlers/solid.ts'
import { buildHandler as buildSveltekitHandler } from './handlers/sveltekit.ts'
import { buildHandler as buildTanstackStartHandler } from './handlers/tanstack-start.ts'
import type { FrameworkConfig } from '../types.ts'
import type {
  ServerRenderHandler,
  SSRRequestThroughputBenchmarkResult,
} from './types.ts'

const frameworks: FrameworkConfig[] = frameworksConfig
const throughputFrameworks = frameworks.filter(({ app }) =>
  app?.measurements.includes('ssrRequestThroughput'),
)

const handlers = new Map<string, () => Promise<ServerRenderHandler>>([
  ['app-baseline-html', buildBaselineHtmlHandler],
  ['app-astro', buildAstroHandler],
  ['app-next-js', buildNextJSHandler],
  ['app-nuxt', buildNuxtHandler],
  ['app-pracht', buildPrachtHandler],
  ['app-react-router', buildReactRouterHandler],
  ['app-solid-start', buildSolidStartHandler],
  ['app-solid', buildSolidHandler],
  ['app-sveltekit', buildSveltekitHandler],
  ['app-tanstack-start-react', buildTanstackStartHandler],
])

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
  const buildHandler = handlers.get(packageName)
  if (!buildHandler) {
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
