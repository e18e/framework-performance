import { measurementsConfig } from '@framework-performance/results/measurements-config'
import { runSSRRequestThroughputBenchmark } from '../benchmarks/ssr-request-throughput/index.ts'
import { benchmarkOutputPath } from '../utils/paths.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  requireMeasurements(framework, ['ssrThroughput'])

  const runs = measurementsConfig.ssrThroughput.runs

  console.info(
    `Running SSR request throughput benchmark for ${packageName} (${runs} runs)...\n`,
  )

  const result = await runSSRRequestThroughputBenchmark(
    framework,
    projectConfig,
  )

  writeJsonFile(benchmarkOutputPath(packageName, 'ssrThroughput-stats.json'), {
    frameworkVersion,
    ssrThroughput: result.benchmark,
  })

  console.info(
    `\n✓ Saved ${result.displayName} v${frameworkVersion} (${result.package})`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
