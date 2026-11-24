import { InstallBenchmark } from '@framework-performance/results/benchmark-schemas'
import { measurementsConfig } from './measurements.ts'
import { summarizeMetric } from './sample-statistics.ts'
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import { installDependencies } from './benchmark-utils.ts'
import { packagesDir } from './constants.ts'
import {
  getDirectorySize,
  benchmarkOutputPath,
  writeJsonFile,
  getBenchmarkContext,
} from './utils.ts'

function execCommand(command: string, cwd: string): string {
  return execSync(command, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function copyFreshProject(sourceDir: string, runDir: string): string {
  const projectDir = join(runDir, 'project')
  mkdirSync(runDir, { recursive: true })
  cpSync(sourceDir, projectDir, {
    recursive: true,
    filter: (sourcePath) => basename(sourcePath) !== 'node_modules',
  })
  return projectDir
}

function measureInstallTime(
  cwd: string,
  storeDir: string,
  cacheDir: string,
): number {
  const start = performance.now()
  installDependencies(cwd, storeDir, cacheDir)
  const end = performance.now()

  return Math.round(end - start)
}

function getFrameworkVersion(cwd: string, frameworkPackage: string): string {
  try {
    const output = execCommand(
      `pnpm list "${frameworkPackage}" --depth=0 --json`,
      cwd,
    )
    const data = JSON.parse(output)
    return (
      data[0]?.dependencies?.[frameworkPackage]?.version ||
      data[0]?.devDependencies?.[frameworkPackage]?.version ||
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

async function main() {
  const { packageName, framework } = await getBenchmarkContext(
    'Usage: run-install-benchmark <package-name>\nExample: run-install-benchmark starter-astro',
  )

  const runFrequency = measurementsConfig.install.runs

  console.info(
    `Running install benchmark for ${framework.displayName} (${packageName})...`,
  )
  console.info(`Run frequency: ${runFrequency}\n`)

  const sourceDir = join(packagesDir, packageName)
  const tempDir = join(
    tmpdir(),
    `framework-benchmark-${packageName}-${Date.now()}`,
  )

  console.info(`Using isolated benchmark directory ${tempDir}...`)

  try {
    const iterations: {
      duration: number
    }[] = []
    let finalProjectDir = ''
    let previousRunDir = ''

    for (let i = 1; i <= runFrequency; i++) {
      if (previousRunDir) {
        rmSync(previousRunDir, { recursive: true, force: true })
      }

      const runDir = join(tempDir, `run-${i}`)
      const projectDir = copyFreshProject(sourceDir, runDir)
      const storeDir = join(runDir, 'store')
      const cacheDir = join(runDir, 'cache')

      console.info(`\nInstall run ${i}/${runFrequency}...`)
      const time = measureInstallTime(projectDir, storeDir, cacheDir)
      iterations.push({
        duration: time,
      })
      console.info(`  Install time: ${time}ms`)

      finalProjectDir = projectDir
      previousRunDir = runDir
    }

    const frameworkVersion = getFrameworkVersion(
      finalProjectDir,
      framework.frameworkPackage,
    )
    console.info(`\nFramework version: ${frameworkVersion}`)

    const nodeModulesPath = join(finalProjectDir, 'node_modules')
    const nodeModulesSize = getDirectorySize(nodeModulesPath)
    console.info(`node_modules size: ${nodeModulesSize} bytes`)

    const installDuration = InstallBenchmark.parse({
      name: 'install',
      project: 'starter',
      iterations: {
        runs: iterations.length,
        iterations: iterations.map(({ duration }) => ({
          duration: { value: duration, unit: 'ms' },
        })),
      },
      duration: summarizeMetric(iterations.map((run) => run.duration)),
    })
    const outputPath = benchmarkOutputPath(packageName, 'install-stats.json')
    writeJsonFile(outputPath, {
      frameworkVersion,
      installDuration,
      starterNodeModuleSize: { value: nodeModulesSize, unit: 'bytes' },
    })
    console.info(`\n✓ Saved install stats to ${outputPath}`)
    console.info(`  Average: ${installDuration.duration.mean}ms`)
    console.info(`  Min: ${installDuration.duration.min}ms`)
    console.info(`  Max: ${installDuration.duration.max}ms`)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('Install benchmark failed:', error)
  process.exit(1)
})
