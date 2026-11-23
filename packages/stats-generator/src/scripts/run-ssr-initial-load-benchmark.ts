import { writeRuntimeArtifact } from '../benchmark-artifacts.ts'
import { runInitialLoadBenchmark } from '../initialLoad/index.ts'
import { measurementsConfig } from '../measurements.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from '../utils.ts'

async function main() {
  const { packageName } = parseArgs(
    'Usage: run-ssr-initial-load-benchmark <package-name> \nExample: run-ssr-initial-load-benchmark app-astro',
  )
  const { framework } = await getFrameworkByPackage(packageName)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )

  const result = await runInitialLoadBenchmark(
    packageName,
    measurementsConfig.ssrInitialLoad.path,
  )

  writeRuntimeArtifact(packageName, frameworkVersion, {
    browserVersion: result.browserVersion,
    ssrInitialLoad: result.initialLoad,
  })

  console.info(
    `\n✓ Saved ${packageName} v${frameworkVersion ?? 'unknown'} (${packageName})`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
