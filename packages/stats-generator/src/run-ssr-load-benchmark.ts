import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { getLoadPeakStage } from '@framework-performance/results/selection'
import { getSSRLoadKind } from './ssrLoad/config.ts'
import {
  runSSRLoadBenchmark,
  supportsSSRLoadBenchmark,
} from './ssrLoad/index.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from './utils.ts'

async function main() {
  const { packageName } = parseArgs(
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

  const { framework } = await getFrameworkByPackage(packageName)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )
  const result = await runSSRLoadBenchmark(packageName)

  writeRuntimeArtifact(packageName, frameworkVersion, {
    [result.tests.name]: result.tests,
  })

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
