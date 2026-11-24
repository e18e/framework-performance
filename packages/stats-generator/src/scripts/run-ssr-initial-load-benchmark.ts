import { runInitialLoadBenchmark } from '../initialLoad/index.ts'
import { measurementsConfig } from '../measurements.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  writeJsonFile,
} from '../utils.ts'

async function main() {
  const { packageName, frameworkVersion } = await getBenchmarkContext(
    'Usage: run-ssr-initial-load-benchmark <package-name> \nExample: run-ssr-initial-load-benchmark app-astro',
  )

  const result = await runInitialLoadBenchmark(
    packageName,
    measurementsConfig.ssrInitialLoad.path,
  )

  writeJsonFile(benchmarkOutputPath(packageName, 'ssrInitialLoad-stats.json'), {
    frameworkVersion,
    ssrInitialLoad: result.initialLoad,
  })

  console.info(`\n✓ Saved ${packageName} v${frameworkVersion} (${packageName})`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
