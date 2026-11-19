import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { measurementsConfig } from './measurements.ts'
import { parseRunFrequency } from './benchmark-utils.ts'
import {
  runSSRRequestThroughputBenchmark,
  supportsSSRRequestThroughputBenchmark,
} from './ssrRequestThroughput/index.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from './utils.ts'

async function main() {
  const { packageName, args } = parseArgs(
    'Usage: run-ssr-request-throughput-benchmark <package-name> [runs]\nExample: run-ssr-request-throughput-benchmark app-astro 5',
  )

  const runs = parseRunFrequency(
    args[0],
    measurementsConfig.ssrRequestThroughput.runs,
  )

  console.info(
    `Running SSR request throughput benchmark for ${packageName} (${runs} runs)...\n`,
  )

  if (!supportsSSRRequestThroughputBenchmark(packageName)) {
    console.info(
      `SSR request throughput benchmark is not configured for ${packageName}; skipping.`,
    )
    return
  }

  const { framework } = await getFrameworkByPackage(packageName)

  const result = await runSSRRequestThroughputBenchmark(packageName, runs)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )

  writeRuntimeArtifact(packageName, frameworkVersion, {
    ssrThroughput: result.benchmark,
  })

  console.info(
    `\n✓ Saved ${result.displayName} v${frameworkVersion ?? 'unknown'} (${result.package})`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
