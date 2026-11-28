import { runBenchmark } from './run-benchmark.ts'
import { buildHandler as buildBaselineHtmlHandler } from './handlers/baseline-html.ts'
import { buildHandler as buildAstroHandler } from './handlers/astro.ts'
import { buildHandler as buildMastroHandler } from './handlers/mastro.ts'
import { buildHandler as buildNextJSHandler } from './handlers/nextjs.ts'
import { buildHandler as buildNuxtHandler } from './handlers/nuxt.ts'
import { buildHandler as buildPrachtHandler } from './handlers/pracht.ts'
import { buildHandler as buildReactRouterHandler } from './handlers/react-router.ts'
import { buildHandler as buildSolidStartHandler } from './handlers/solid-start.ts'
import { buildHandler as buildSolidHandler } from './handlers/solid.ts'
import { buildHandler as buildSveltekitHandler } from './handlers/sveltekit.ts'
import { buildHandler as buildTanstackStartHandler } from './handlers/tanstack-start.ts'
import { buildHandler as buildVoidHandler } from './handlers/void.ts'
import type { FrameworkConfig, TestConfig } from '../../types.ts'
import type {
  ServerRenderHandler,
  SSRRequestThroughputBenchmarkResult,
} from './types.ts'

const handlers = new Map<string, () => Promise<ServerRenderHandler>>([
  ['app-baseline-html', buildBaselineHtmlHandler],
  ['app-astro', buildAstroHandler],
  ['app-mastro', buildMastroHandler],
  ['app-next-js', buildNextJSHandler],
  ['app-nuxt', buildNuxtHandler],
  ['app-pracht', buildPrachtHandler],
  ['app-react-router', buildReactRouterHandler],
  ['app-solid-start', buildSolidStartHandler],
  ['app-solid', buildSolidHandler],
  ['app-sveltekit', buildSveltekitHandler],
  ['app-tanstack-start-react', buildTanstackStartHandler],
  ['app-void', buildVoidHandler],
])

export async function runSSRRequestThroughputBenchmark(
  framework: FrameworkConfig,
  app: TestConfig,
): Promise<SSRRequestThroughputBenchmarkResult> {
  const buildHandler = handlers.get(app.package)
  if (!buildHandler) {
    throw new Error(
      `SSR request throughput handler is not configured for ${app.package}`,
    )
  }

  const name = `${app.benchmarkName ?? framework.name}-ssr-request-throughput`
  const displayName = `${framework.displayName} SSR Request Handler Throughput`

  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'

  try {
    const handler = await buildHandler()
    const results = await runBenchmark([
      {
        name,
        displayName,
        package: app.package,
        handler,
      },
    ])

    return results[0]
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }
  }
}
