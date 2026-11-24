import { measurementsConfig } from './measurements.ts'
import {
  runSSRRequestThroughputBenchmark,
  supportsSSRRequestThroughputBenchmark,
} from './ssrRequestThroughput/index.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  writeJsonFile,
} from './utils.ts'

async function main() {
  const { packageName, frameworkVersion } = await getBenchmarkContext(
    'Usage: run-ssr-request-throughput-benchmark <package-name>\nExample: run-ssr-request-throughput-benchmark app-astro',
  )

  const runs = measurementsConfig.ssrThroughput.runs

  console.info(
    `Running SSR request throughput benchmark for ${packageName} (${runs} runs)...\n`,
  )

  if (!supportsSSRRequestThroughputBenchmark(packageName)) {
    console.info(
      `SSR request throughput benchmark is not configured for ${packageName}; skipping.`,
    )
    return
  }

  const result = await runSSRRequestThroughputBenchmark(packageName)

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
