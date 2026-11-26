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
  requireMeasurements(framework, ['ssrInitialLoadFrameworkImages'])

  const jpegResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadFrameworkImages.paths.jpeg,
  )
  const webpResult = await runInitialLoadBenchmark(
    framework,
    projectConfig,
    measurementsConfig.ssrInitialLoadFrameworkImages.paths.jpeg,
  )

  writeJsonFile(
    benchmarkOutputPath(packageName, 'ssrInitialLoadFrameworkImages-stats.json'),
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
