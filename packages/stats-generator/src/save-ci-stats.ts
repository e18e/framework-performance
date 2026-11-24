import {
  readBenchmarkResult,
  saveBenchmarkResult,
} from '@framework-performance/results/storage'
import {
  BenchmarkCIResultSchema,
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
import {
  benchmarkArtifacts,
  type BenchmarkArtifact,
} from './benchmark-artifacts.ts'
import type { FrameworkConfig } from './types.ts'

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
    const prepared = BenchmarkCIResultSchema.parse(
      JSON.parse(
        readFileSync(
          join(artifactsDir, 'prepared-results', `${framework.name}.json`),
          'utf8',
        ),
      ),
    )
    if (prepared.framework !== framework.name)
      throw new Error(
        `Expected prepared result for ${framework.name}, got ${prepared.framework}`,
      )

    for (const project of ['starter', 'app'] as const) {
      const target = framework[project]
      if (!target) continue
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
          if (key === 'frameworkVersion') {
            if (value !== prepared.frameworkVersion)
              throw new Error(
                `Framework version mismatch in ${file}: expected ${prepared.frameworkVersion}, got ${value}`,
              )
          } else if (key === 'dependencyCounts')
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
      ...prepared,
      ...fresh,
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
