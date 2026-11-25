import {
  readBenchmarkResult,
  saveBenchmarkResult,
} from '@framework-performance/results/storage'
import {
  BenchmarkResultSchema,
  type BenchmarkResult,
} from '@framework-performance/results/benchmark-schemas'
import { withSummaryVariance } from '@framework-performance/results/comparison'
import { measurementsConfig } from './measurements.ts'
import { getSSRLoadPath } from './ssrLoad/config.ts'
import { join } from 'node:path'
import { getFrameworks } from './get-frameworks.ts'
import { globSync } from 'node:fs'
import { readJsonFile } from './utils.ts'
import type { FrameworkConfig } from './types.ts'

function readArtifact<T = Record<string, unknown>>(file: string) {
  const artifact = readJsonFile<T>(file)
  if (artifact === null) throw new Error(`Invalid artifact: ${file}`)
  return artifact
}

export async function processCIStats(
  artifactsDir: string,
  {
    validateOnly = false,
    frameworks: configuredFrameworks,
  }: {
    validateOnly?: boolean
    frameworks?: FrameworkConfig[]
  } = {},
) {
  const frameworks = configuredFrameworks ?? (await getFrameworks())
  const results = new Map<string, BenchmarkResult>()

  for (const framework of frameworks) {
    const previous = readBenchmarkResult(framework.name)
    const fresh: Record<string, unknown> = {}
    const dependencyCounts: Record<string, unknown> = {}
    const preparedFile = join('prepared-results', `${framework.name}.json`)
    const prepared = readArtifact<Omit<BenchmarkResult, 'configuration'>>(
      join(artifactsDir, preparedFile),
    )
    if (prepared.framework !== framework.name)
      throw new Error(
        `Expected ${framework.name} in ${preparedFile}, got ${prepared.framework}`,
      )

    for (const file of globSync(`*-stats-${framework.name}/*.json`, {
      cwd: artifactsDir,
    })) {
      const {
        frameworkVersion,
        dependencyCounts: counts,
        ...measurements
      } = readArtifact(join(artifactsDir, file))
      if (
        frameworkVersion !== undefined &&
        frameworkVersion !== prepared.frameworkVersion
      )
        throw new Error(
          `Framework version mismatch in ${file}: expected ${prepared.frameworkVersion}, got ${frameworkVersion}`,
        )
      Object.assign(fresh, measurements)
      Object.assign(dependencyCounts, counts)
    }
    if (
      framework.measurements.includes('dependencyCounts') &&
      Object.keys(dependencyCounts).length
    ) {
      fresh.dependencyCounts = {
        ...dependencyCounts,
        name: 'dependencyCount',
        project: 'starter',
      }
    }
    for (const key of framework.measurements) {
      if (!Object.hasOwn(fresh, key))
        throw new Error(`Missing ${key} for ${framework.name}`)
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
    const result = withSummaryVariance(
      { ...prepared, ...fresh, configuration },
      previous,
      Object.keys(fresh),
    )
    results.set(framework.name, BenchmarkResultSchema.parse(result))
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
