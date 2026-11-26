import { measurementsConfig } from './measurements.ts'
import { runSSRRequestThroughputBenchmark } from './ssrRequestThroughput/index.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  requireMeasurements,
  writeJsonFile,
} from './utils.ts'

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
