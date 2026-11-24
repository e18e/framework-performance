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
    frameworks: configuredFrameworks,
    browserVersion = process.env.BROWSER_VERSION,
  }: {
    validateOnly?: boolean
    frameworks?: FrameworkConfig[]
    browserVersion?: string
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
    const artifactVersions = new Map<string, string>()
    const projects: Partial<
      Record<'starter' | 'app', BenchmarkResult['projects']['app']>
    > = { ...previous?.projects }

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
          throw new Error(`Missing or invalid measurement artifact: ${file}`, {
            cause: error,
          })
        }

        for (const [key, value] of Object.entries(artifact)) {
          if (key === 'frameworkVersion')
            artifactVersions.set(folder, String(value))
          else if (key === 'dependencyCounts')
            Object.assign(dependencyCounts, value)
          else if (key === 'starterNodeModuleSize')
            dependencyCounts[key] = value
          else fresh[key] = value
        }
      }
    }

    if (
      !framework.app?.measurements.length &&
      !framework.starter?.measurements.length
    )
      continue
    const versions = new Set(artifactVersions.values())
    if (versions.size > 1) {
      const details = [...artifactVersions]
        .map(([artifact, version]) => `${artifact}=${version}`)
        .join(', ')
      throw new Error(
        `Measurement artifacts disagree on framework version for ${framework.name}: ${details}`,
      )
    }
    const frameworkVersion = [...versions][0] ?? previous?.frameworkVersion
    if (!frameworkVersion || frameworkVersion === 'unknown')
      throw new Error(`No measured version for ${framework.name}`)

    const sameVersion = frameworkVersion === previous?.frameworkVersion
    if (framework.starter?.measurements.includes('dependencies')) {
      fresh.dependencyCounts = DependencyCountBenchmark.parse({
        ...dependencyCounts,
        name: 'dependencyCount',
        project: 'starter',
      })
    }

    const { plainLinksPath: _plainLinksPath, ...ssrLoad } =
      measurementsConfig.ssrLoad
    const configuration = {
      ...measurementsConfig,
      ssrLoad: {
        ...ssrLoad,
        path: framework.app
          ? getSSRLoadPath(framework.app.package, 'ssrLoad')
          : ssrLoad.path,
      },
    }
    const assembled = BenchmarkResultSchema.parse({
      ...fresh,
      framework: framework.name,
      frameworkVersion,
      frameworkReleasedAt: sameVersion
        ? previous.frameworkReleasedAt
        : await getReleasedAt(framework.frameworkPackage, frameworkVersion),
      browserVersion,
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
  }).catch((error) => {
    console.error('Failed to process CI stats:', error)
    process.exitCode = 1
  })
}
