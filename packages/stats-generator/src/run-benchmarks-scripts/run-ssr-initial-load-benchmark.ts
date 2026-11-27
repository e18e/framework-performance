import { runInitialLoadBenchmark } from '../benchmarks/initial-load/run-initial-load-benchmark.ts'
import { measurementsConfig } from '@framework-performance/results/measurements-config'
import { benchmarkOutputPath } from '../utils/paths.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  requireMeasurements(framework, ['ssrInitialLoad'])

  const resources = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoad.path,
  )

  writeJsonFile(benchmarkOutputPath(packageName, 'ssrInitialLoad-stats.json'), {
    frameworkVersion,
    ssrInitialLoad: {
      name: 'ssrInitialLoad',
      project: 'app',
      resources,
    },
  })

  console.info(
    `\n✓ Saved ${packageName} v${frameworkVersion} (SSR Initial Load)`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
