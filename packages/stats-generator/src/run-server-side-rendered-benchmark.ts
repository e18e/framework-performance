import { writeRuntimeArtifact } from './benchmark-artifacts.ts'
import { parseRunFrequency } from './benchmark-utils.ts'
import { measurementsConfig } from './measurements.ts'
import { runServerSideRenderedBenchmark } from './serverSideRendered/index.ts'
import {
  getFrameworkByPackage,
  getFrameworkVersion,
  parseArgs,
} from './utils.ts'

async function main() {
  const { packageName, args } = parseArgs(
    'Usage: run-server-side-rendered-benchmark <package-name> [runs]\nExample: run-server-side-rendered-benchmark app-astro 5',
  )
  const runs = parseRunFrequency(
    args[0],
    measurementsConfig.serverSideRendered.runs,
  )

  console.info(
    `Running server side rendered benchmark for ${packageName} (${runs} runs)...\n`,
  )

  const { framework } = await getFrameworkByPackage(packageName)
  const frameworkVersion = await getFrameworkVersion(
    packageName,
    framework.frameworkPackage,
  )

  const result = await runServerSideRenderedBenchmark(packageName, runs)

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
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
