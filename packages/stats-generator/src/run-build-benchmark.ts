import { measurementsConfig } from './measurements.ts'
import { execFileSync } from 'node:child_process'
import { cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { copyTrackedProject, installDependencies } from './benchmark-utils.ts'
import { packagesDir } from './constants.ts'
import {
  benchmarkOutputPath,
  writeJsonFile,
  getBenchmarkContext,
} from './utils.ts'
import { createBuildStats } from './build-statistics.ts'
import { summarizeSamples } from './sample-statistics.ts'

function measureBuildTime(cwd: string, buildScript: string): number {
  const start = performance.now()
  execFileSync('pnpm', [buildScript], {
    cwd,
    encoding: 'utf-8',
    stdio: 'inherit',
  })
  const end = performance.now()
  return Math.round(end - start)
}

function getBuildOutputPath(
  projectDir: string,
  buildOutputDir: string,
): string {
  const buildOutputPath = resolve(projectDir, buildOutputDir)
  const relativeBuildOutputPath = relative(projectDir, buildOutputPath)

  if (
    !relativeBuildOutputPath ||
    relativeBuildOutputPath === '..' ||
    relativeBuildOutputPath.startsWith(`..${sep}`) ||
    isAbsolute(relativeBuildOutputPath)
  ) {
    throw new Error(
      `Build output directory must be inside the project: ${buildOutputDir}`,
    )
  }

  return buildOutputPath
}

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext(
    'Usage: run-build-benchmark <package-name>\nExample: run-build-benchmark starter-astro',
  )

  const runFrequency = measurementsConfig.build.runs

  console.info(
    `Running build benchmark for ${framework.displayName} (${packageName})...\n`,
  )

  const packageDir = join(packagesDir, packageName)
  const tempDir = join(
    tmpdir(),
    `framework-build-benchmark-${packageName}-${Date.now()}`,
  )
  const storeDir = join(tempDir, 'store')
  const cacheDir = join(tempDir, 'cache')

  const coldBuildTimesMs: number[] = []
  const warmBuildTimesMs: number[] = []
  let finalProjectDir = ''
  let previousRunDir = ''

  try {
    for (let i = 1; i <= runFrequency; i++) {
      if (previousRunDir) {
        rmSync(previousRunDir, { recursive: true, force: true })
      }

      const runDir = join(tempDir, `run-${i}`)
      const projectDir = join(runDir, 'project')
      copyTrackedProject(packageDir, projectDir)

      console.info(`\nBuild run ${i}/${runFrequency}...`)
      console.info('Installing dependencies outside the timed region...')
      installDependencies(projectDir, storeDir, cacheDir)

      console.info('Cold build...')
      const coldBuildTimeMs = measureBuildTime(
        projectDir,
        projectConfig.buildScript,
      )
      coldBuildTimesMs.push(coldBuildTimeMs)
      console.info(`  Cold build time: ${coldBuildTimeMs}ms`)

      console.info('\nWarm build...')
      const warmBuildTimeMs = measureBuildTime(
        projectDir,
        projectConfig.buildScript,
      )
      warmBuildTimesMs.push(warmBuildTimeMs)
      console.info(`  Warm build time: ${warmBuildTimeMs}ms`)

      finalProjectDir = projectDir
      previousRunDir = runDir
    }

    const finalBuildOutputPath = getBuildOutputPath(
      finalProjectDir,
      projectConfig.buildOutputDir,
    )
    const coldBuildTime = summarizeSamples(coldBuildTimesMs)
    console.info(`\nAvg cold build time: ${coldBuildTime.avgMs} ms`)
    console.info(
      `\nCold build standard deviation: ${coldBuildTime.standardDeviationMs} ms`,
    )
    console.info(`\nMin cold build time: ${coldBuildTime.minMs} ms`)
    console.info(`\nMax cold build time: ${coldBuildTime.maxMs} ms`)

    const warmBuildTime = summarizeSamples(warmBuildTimesMs)
    console.info(`\nAvg warm build time: ${warmBuildTime.avgMs} ms`)
    console.info(
      `\nWarm build standard deviation: ${warmBuildTime.standardDeviationMs} ms`,
    )
    console.info(`\nMin warm build time: ${warmBuildTime.minMs} ms`)
    console.info(`\nMax warm build time: ${warmBuildTime.maxMs} ms`)

    const stats = createBuildStats(coldBuildTimesMs, warmBuildTimesMs)

    const outputPath = benchmarkOutputPath(packageName, 'build-stats.json')
    writeJsonFile(outputPath, { buildDuration: stats })

    const buildOutputPath = getBuildOutputPath(
      packageDir,
      projectConfig.buildOutputDir,
    )
    rmSync(buildOutputPath, { recursive: true, force: true })
    cpSync(finalBuildOutputPath, buildOutputPath, { recursive: true })

    console.info(`\n✓ Saved build stats to ${outputPath}`)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('Build benchmark failed:', error)
  process.exit(1)
})
