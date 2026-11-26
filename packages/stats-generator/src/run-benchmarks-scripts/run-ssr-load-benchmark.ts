import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { getLoadPeakStage } from '@framework-performance/results/selection'
import {
  getSSRLoadKind,
  getSSRLoadPath,
} from '../benchmarks/ssr-load/config.ts'
import { runSSRLoadBenchmark } from '../benchmarks/ssr-load/index.ts'
import { benchmarkOutputPath } from '../utils/paths.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  const kind = getSSRLoadKind()
  requireMeasurements(framework, [kind])

  const label =
    kind === 'ssrLoad' ? 'SSR Load Test' : 'SSR Router Link Load Test'
  console.info(`Running ${label} for ${packageName}...\n`)

  const result = await runSSRLoadBenchmark(
    framework,
    projectConfig,
    getSSRLoadPath(framework, kind),
  )

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
