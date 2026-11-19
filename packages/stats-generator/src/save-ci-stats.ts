import {
  readBenchmarkResult,
  saveBenchmarkResult,
} from '@framework-performance/results/storage'
import {
  BenchmarkResultSchema,
  DependencyCountBenchmark,
  type BenchmarkResult,
} from '@framework-performance/results/benchmark-schemas'
import { withSummaryVariance } from '@framework-performance/results/comparison'
import { measurementsConfig } from './measurements.ts'
import { getSSRLoadPath } from './ssrLoad/config.ts'
import { join } from 'node:path'
import { getFrameworks } from './get-frameworks.ts'
import { readFileSync } from 'node:fs'
import { getPublishTimes } from './release-dates.ts'
import { getPackageJsonDeps } from './utils.ts'
import {
  benchmarkArtifacts,
  type BenchmarkArtifact,
} from './benchmark-artifacts.ts'
import type { FrameworkConfig } from './types.ts'

const publishTimesCache = new Map<string, Promise<Record<string, string>>>()

async function getReleasedAt(packageName: string, version: string) {
  if (!publishTimesCache.has(packageName)) {
    publishTimesCache.set(packageName, getPublishTimes(packageName))
  }
  const releasedAt = (await publishTimesCache.get(packageName)!)[version]
  if (releasedAt == null)
    throw new Error(`No publish time for ${packageName}@${version}`)
  return releasedAt
}

export async function processCIStats(
  artifactsDir: string,
  {
    validateOnly = false,
    requireAllArtifacts = false,
    frameworks: configuredFrameworks,
  }: {
    validateOnly?: boolean
    requireAllArtifacts?: boolean
    frameworks?: FrameworkConfig[]
  } = {},
) {
  const timingMeasuredAt = new Date().toISOString()
  const runner = process.env.RUNNER_LABEL || 'local'
  const frameworks = configuredFrameworks ?? (await getFrameworks())
  const results = new Map<string, BenchmarkResult>()

  for (const framework of frameworks) {
    const previous = readBenchmarkResult(framework.name)
    const fresh: Record<string, unknown> = {}
    const dependencyCounts: Record<string, unknown> = {}
    const versions = new Set<string>()
    const browserVersions = new Set<string>()
    const projects: Partial<
      Record<'starter' | 'app', BenchmarkResult['projects']['app']>
    > = { ...previous?.projects }
    const measuredConfigurations = new Set<keyof typeof measurementsConfig>()

    for (const project of ['starter', 'app'] as const) {
      const target = framework[project]
      if (!target) continue
      projects[project] = {
        path: `packages/${target.package}` as BenchmarkResult['projects']['app']['path'],
        packageJson: getPackageJsonDeps(target.package),
      }

      for (const [
        measurement,
        folder,
        filename,
        schema,
      ] of benchmarkArtifacts) {
        if (!target.measurements.includes(measurement)) continue
        const file = join(
          artifactsDir,
          `${folder}-stats-${framework.name}`,
          filename,
        )
        let artifact: BenchmarkArtifact
        try {
          artifact = schema.parse(JSON.parse(readFileSync(file, 'utf8')))
        } catch (error) {
          if (
            !requireAllArtifacts &&
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
          )
            continue
          throw new Error(`Missing or invalid measurement artifact: ${file}`, {
            cause: error,
          })
        }

        measuredConfigurations.add(measurement)
        for (const [key, value] of Object.entries(artifact)) {
          if (key === 'frameworkVersion') versions.add(String(value))
          else if (key === 'browserVersion') browserVersions.add(String(value))
          else if (key === 'dependencyCounts')
            Object.assign(dependencyCounts, value)
          else if (key === 'starterNodeModuleSize')
            dependencyCounts[key] = value
          else fresh[key] = value
        }
      }
    }

    if (measuredConfigurations.size === 0) continue
    if (versions.size > 1 || browserVersions.size > 1)
      throw new Error(
        `Measurement artifacts disagree on versions for ${framework.name}`,
      )
    const frameworkVersion = [...versions][0] ?? previous?.frameworkVersion
    if (!frameworkVersion || frameworkVersion === 'unknown')
      throw new Error(`No measured version for ${framework.name}`)

    const sameVersion = frameworkVersion === previous?.frameworkVersion
    const retained = !requireAllArtifacts && sameVersion ? previous : null
    if (Object.keys(dependencyCounts).length > 0) {
      const parsed = DependencyCountBenchmark.safeParse({
        ...(retained?.framework !== 'baseline-html' &&
          retained?.dependencyCounts),
        ...dependencyCounts,
        name: 'dependencyCount',
        project: 'starter',
      })
      if (parsed.success) fresh.dependencyCounts = parsed.data
      else if (
        requireAllArtifacts &&
        framework.starter?.measurements.includes('dependencies')
      )
        throw parsed.error
    }

    const { plainLinksPath: _plainLinksPath, ...ssrLoad } =
      measurementsConfig.ssrLoad
    const currentConfiguration = {
      ...measurementsConfig,
      ssrLoad: {
        ...ssrLoad,
        path: framework.app
          ? getSSRLoadPath(framework.app.package, 'ssrLoad')
          : ssrLoad.path,
      },
    }
    const configuration = retained
      ? { ...retained.configuration }
      : currentConfiguration
    if (retained) {
      for (const measurement of measuredConfigurations) {
        configuration[measurement] = currentConfiguration[measurement]
      }
    }
    const assembled = BenchmarkResultSchema.parse({
      ...retained,
      ...fresh,
      framework: framework.name,
      frameworkVersion,
      frameworkReleasedAt: sameVersion
        ? previous.frameworkReleasedAt
        : await getReleasedAt(framework.frameworkPackage, frameworkVersion),
      browserVersion:
        [...browserVersions][0] ??
        (retained?.framework === 'baseline-html'
          ? undefined
          : retained?.browserVersion),
      timingMeasuredAt,
      runner,
      projects,
      configuration,
    })
    results.set(
      framework.name,
      withSummaryVariance(assembled, previous, Object.keys(fresh)),
    )
  }

  if (!validateOnly) {
    for (const result of results.values()) saveBenchmarkResult(result)
  }
  console.info(
    validateOnly ? 'All CI stats are valid' : 'Saved benchmark results',
  )
  return results
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  processCIStats(args.find((arg) => !arg.startsWith('--')) ?? 'artifacts', {
    validateOnly: args.includes('--validate-only'),
    requireAllArtifacts: args.includes('--require-all-artifacts'),
  }).catch((error) => {
    console.error('Failed to process CI stats:', error)
    process.exitCode = 1
  })
}
