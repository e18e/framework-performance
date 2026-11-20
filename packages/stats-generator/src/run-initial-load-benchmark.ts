import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { runInitialLoadBenchmark } from './initialLoad/index.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from './utils.ts'

async function main() {
  const { packageName } = parseArgs(
    'Usage: run-initial-load-benchmark <package-name> \nExample: run-initial-load-benchmark app-astro',
  )
  const { framework } = await getFrameworkByPackage(packageName)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )

  const result = await runInitialLoadBenchmark(packageName)

  writeRuntimeArtifact(packageName, frameworkVersion, {
    browserVersion: result.browserVersion,
    ssrInitialLoad: result.initialLoad,
  })

  console.info(
    `\n✓ Saved ${packageName} v${frameworkVersion ?? 'unknown'} (${packageName})`,
  )
  console.info(
    `  Requests: ${result.initialLoad.resources.total.requestCount.value}`,
  )
  console.info(
    `  Transfer: ${result.initialLoad.resources.total.transferSize.value} bytes`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
