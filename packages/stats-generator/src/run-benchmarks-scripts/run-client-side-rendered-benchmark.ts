import { measurementsConfig } from '@framework-performance/results/measurements-config'
import { runClientSideRenderedBenchmark } from '../benchmarks/client-side-rendered/index.ts'
import { benchmarkOutputPath } from '../utils/paths.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'

async function main() {
  const { packageName, framework, projectConfig, frameworkVersion } =
    await getBenchmarkContext({ project: 'app' })
  requireMeasurements(framework, ['csrLighthouse'])

  const runs = measurementsConfig.csrLighthouse.runs

  console.info(
    `Running client-side rendered benchmark for ${packageName} (${runs} runs)...\n`,
  )

  const result = await runClientSideRenderedBenchmark(framework, projectConfig)

  writeJsonFile(benchmarkOutputPath(packageName, 'csrLighthouse-stats.json'), {
    frameworkVersion,
    csrLighthouse: result.clientSideRendered,
  })

  console.info(
    `\n✓ Saved ${result.displayName} v${frameworkVersion} (${packageName})`,
  )
  console.info(`  First Paint: ${result.clientSideRendered.firstPaint.mean}ms`)
  console.info(
    `  FCP:         ${result.clientSideRendered.firstContentfulPaint.mean}ms`,
  )
  const interaction = result.clientSideRendered.interaction
  console.info(`  Interaction: ${interaction.interactionLatency.mean}ms`)
  console.info(`    Input delay:  ${interaction.inputDelay.mean}ms`)
  console.info(`    Processing:   ${interaction.processingDuration.mean}ms`)
  console.info(`    Presentation: ${interaction.presentationDelay.mean}ms`)
  const work = result.clientSideRendered.interactionWork
  console.info(`  Work to commit: ${work?.workToCommit.mean}ms`)
  console.info(`    Rendering work: ${work?.renderingWork.mean}ms`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
