import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { getLoadPeakStage } from '@framework-performance/results/selection'
import { getSSRLoadKind } from './ssrLoad/config.ts'
import {
  runSSRLoadBenchmark,
  supportsSSRLoadBenchmark,
} from './ssrLoad/index.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  writeJsonFile,
} from './utils.ts'

async function main() {
  const { packageName, frameworkVersion } = await getBenchmarkContext(
    'Usage: run-ssr-load-benchmark <package-name>\nExample: run-ssr-load-benchmark app-astro',
  )

  if (!supportsSSRLoadBenchmark(packageName)) {
    console.info(
      `SSR load benchmark is not configured for ${packageName}; skipping.`,
    )
    return
  }

  const label =
    getSSRLoadKind() === 'ssrLoad'
      ? 'SSR Load Test'
      : 'SSR Router Link Load Test'
  console.info(`Running ${label} for ${packageName}...\n`)

  const result = await runSSRLoadBenchmark(packageName)

  const measurement = result.tests
  writeJsonFile(
    benchmarkOutputPath(packageName, `${measurement.name}-stats.json`),
    {
      frameworkVersion,
      [measurement.name]: measurement,
    },
  )

  const sweep =
    result.tests.iterations.iterations[
      result.tests.representativeIterationIndex
    ]!
  const peak = getLoadPeakStage(SSRLoadStageOptions.map((key) => sweep[key]))
  console.info(
    `\n✓ Saved ${label} stats for ${packageName}: ${peak.requestsPerSecond.value} req/s at ${peak.connections} connections`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
