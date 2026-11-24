import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { measurementsConfig } from './measurements.ts'
import { runServerSideRenderedBenchmark } from './serverSideRendered/index.ts'
import { getBenchmarkContext } from './utils.ts'

async function main() {
  const { packageName, frameworkVersion } = await getBenchmarkContext(
    'Usage: run-server-side-rendered-benchmark <package-name>\nExample: run-server-side-rendered-benchmark app-astro',
  )
  const runs = measurementsConfig.ssrLighthouse.runs

  console.info(
    `Running server side rendered benchmark for ${packageName} (${runs} runs)...\n`,
  )

  const result = await runServerSideRenderedBenchmark(packageName)

  writeRuntimeArtifact(packageName, frameworkVersion, {
    browserVersion: result.browserVersion,
    ssrLighthouse: result.serverSideRendered,
  })

  console.info(
    `\n✓ Saved ${result.displayName} v${frameworkVersion ?? 'unknown'} (${packageName})`,
  )
  console.info(`  First Paint: ${result.serverSideRendered.firstPaint.mean}ms`)
  console.info(
    `  FCP:         ${result.serverSideRendered.firstContentfulPaint.mean}ms`,
  )
  const interaction = result.serverSideRendered.interaction
  console.info(`  Interaction: ${interaction.interactionLatency.mean}ms`)
  console.info(`    Input delay:  ${interaction.inputDelay.mean}ms`)
  console.info(`    Processing:   ${interaction.processingDuration.mean}ms`)
  console.info(`    Presentation: ${interaction.presentationDelay.mean}ms`)
  const work = result.serverSideRendered.interactionWork
  console.info(`  Work to commit: ${work?.workToCommit.mean}ms`)
  console.info(`    Rendering work: ${work?.renderingWork.mean}ms`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
