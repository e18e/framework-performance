import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { parseRunFrequency } from './benchmark-utils.ts'
import { measurementsConfig } from './measurements.ts'
import { runClientSideRenderedBenchmark } from './clientSideRendered/index.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from './utils.ts'

async function main() {
  const { packageName, args } = parseArgs(
    'Usage: run-client-side-rendered-benchmark <package-name> [runs]\nExample: run-client-side-rendered-benchmark app-astro 5',
  )
  const runs = parseRunFrequency(
    args[0],
    measurementsConfig.clientSideRendered.runs,
  )

  console.info(
    `Running client-side rendered benchmark for ${packageName} (${runs} runs)...\n`,
  )

  const { framework } = await getFrameworkByPackage(packageName)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )

  const result = await runClientSideRenderedBenchmark(packageName, runs)

  writeRuntimeArtifact(packageName, frameworkVersion, {
    browserVersion: result.browserVersion,
    csrLighthouse: result.clientSideRendered,
  })

  console.info(
    `\n✓ Saved ${result.displayName} v${frameworkVersion ?? 'unknown'} (${packageName})`,
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
