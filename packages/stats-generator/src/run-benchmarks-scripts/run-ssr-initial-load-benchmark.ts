import { runInitialLoadBenchmark } from '../benchmarks/initial-load/run-initial-load-benchmark.ts'
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

  console.info(`\n✓ Saved ${packageName} v${frameworkVersion} (${packageName})`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
