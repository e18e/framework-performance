import { runServerSideRenderedBenchmark } from '../benchmarks/server-side-rendered/index.ts'
import { benchmarkOutputPath } from '../utils/paths.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  requireMeasurements(framework, ['ssrLighthouse'])

  const result = await runServerSideRenderedBenchmark(framework, projectConfig)

  writeJsonFile(benchmarkOutputPath(packageName, 'ssrLighthouse-stats.json'), {
    frameworkVersion,
    ssrLighthouse: result.serverSideRendered,
  })

  console.info(`\n✓ Saved ${packageName} v${frameworkVersion} (SSR Lighthouse)`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
