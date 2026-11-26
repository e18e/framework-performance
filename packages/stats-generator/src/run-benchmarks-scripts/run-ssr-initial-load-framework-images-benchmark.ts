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
  requireMeasurements(framework, ['ssrInitialLoadFrameworkImages'])

  const jpegResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadFrameworkImages.paths.jpeg,
  )
  const webpResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadFrameworkImages.paths.webp,
  )

  writeJsonFile(
    benchmarkOutputPath(
      packageName,
      'ssrInitialLoadFrameworkImages-stats.json',
    ),
    {
      frameworkVersion,
      ssrInitialLoadFrameworkImages: {
        name: 'ssrInitialLoadFrameworkImages',
        project: 'app',
        jpegResources: jpegResult,
        webpResources: webpResult,
      },
    },
  )

  console.info(`\n✓ Saved ${packageName} v${frameworkVersion} (${packageName})`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
