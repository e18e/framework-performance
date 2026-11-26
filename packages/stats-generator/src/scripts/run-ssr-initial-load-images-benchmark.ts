import { runInitialLoadBenchmark } from '../initialLoad/run-initial-load-benchmark.ts'
import { measurementsConfig } from '../measurements.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  requireMeasurements,
  writeJsonFile,
} from '../utils.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  requireMeasurements(framework, ['ssrInitialLoadImages'])

  const jpegResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadImages.paths.jpeg,
  )
  const webpResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadImages.paths.webp,
  )

  writeJsonFile(
    benchmarkOutputPath(packageName, 'ssrInitialLoadImages-stats.json'),
    {
      frameworkVersion,
      ssrInitialLoadImages: {
        name: 'ssrInitialLoadImages',
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
