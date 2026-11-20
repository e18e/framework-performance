import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { selectRepresentativeIteration } from '@framework-performance/results/selection'
import { z } from 'zod'
import {
  BrowserBaselineBenchmark,
  BuildBenchmark,
  CoreJsBenchmark,
  CSRLighthouseBenchmark,
  DependencyCountBenchmark,
  DevServerStartupBenchmark,
  InstallBenchmark,
  MinimumNodeVersionBenchmark,
  SSRInitialLoadBenchmark,
  SSRLighthouseBenchmark,
  SSRLoadBenchmark,
  SSRLoadRouterLinksBenchmark,
  SSRThroughputBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import type { TestConfig } from './types.ts'
import { measurementsConfig } from './measurements.ts'
import { summarizeMetric } from './sample-statistics.ts'
import { isDeepStrictEqual } from 'node:util'
import { benchmarkOutputPath, readJsonFile, writeJsonFile } from './utils.ts'

const version = z.object({ frameworkVersion: z.string().min(1) })
const browser = version.extend({ browserVersion: z.string().min(1) })

const throughput = SSRThroughputBenchmark.refine(
  ({ requests, iterations }) =>
    requests.value ===
    iterations.iterations.reduce((total, run) => total + run.requests.value, 0),
  {
    message: 'Expected total requests to match the iterations',
    path: ['requests'],
  },
)

type LoadResult = z.output<
  typeof SSRLoadBenchmark | typeof SSRLoadRouterLinksBenchmark
>

function validateLoadArtifact(value: LoadResult) {
  const config =
    value.name === 'ssrLoad'
      ? measurementsConfig.ssrLoad
      : measurementsConfig.ssrRouterLinkLoad
  const iterations = value.iterations.iterations
  const sweeps = iterations.map((run) =>
    SSRLoadStageOptions.map((key) => run[key]),
  )
  const stages = sweeps.flat()
  if (
    stages.reduce((total, stage) => total + stage.requests.value, 0) !==
      value.totalRequests.value ||
    stages.reduce((total, stage) => total + stage.errors.value, 0) !==
      value.totalErrors.value
  )
    return false

  try {
    if (
      selectRepresentativeIteration(sweeps) !==
      value.representativeIterationIndex
    )
      return false
  } catch {
    return false
  }

  return SSRLoadStageOptions.every((key, index) => {
    const { connections, ...summary } = value[key]
    if (
      connections !== config.stageConnections[index] ||
      iterations.some((run) => run[key].connections !== connections)
    )
      return false
    return (Object.keys(summary) as (keyof typeof summary)[]).every(
      (metric) => {
        const {
          unit: _unit,
          variance: _variance,
          ...measured
        } = summary[metric]
        const expected = summarizeMetric(
          iterations.map((run) => run[key][metric].value),
        )
        return isDeepStrictEqual(measured, expected)
      },
    )
  })
}

const loadArtifactError =
  'Expected SSR load totals, representative sweep, and stage summaries to match the measured and configured stages'
const load = SSRLoadBenchmark.refine(validateLoadArtifact, loadArtifactError)
const routerLoad = SSRLoadRouterLinksBenchmark.refine(
  validateLoadArtifact,
  loadArtifactError,
)

function hasInteractionWork(value: {
  interactionWork?: unknown
  iterations: { iterations: { interactionWork?: unknown }[] }
}) {
  return (
    value.interactionWork !== undefined &&
    value.iterations.iterations.every(
      (run) => run.interactionWork !== undefined,
    )
  )
}

const interactionWorkError = 'Expected interaction work for every run'
const csrLighthouse = CSRLighthouseBenchmark.refine(
  hasInteractionWork,
  interactionWorkError,
)
const ssrLighthouse = SSRLighthouseBenchmark.refine(
  hasInteractionWork,
  interactionWorkError,
)

export const benchmarkArtifacts = [
  [
    'install',
    'install',
    'install-stats.json',
    version.extend({
      installDuration: InstallBenchmark,
      starterNodeModuleSize:
        DependencyCountBenchmark.shape.starterNodeModuleSize,
    }),
  ],
  [
    'build',
    'build',
    'build-stats.json',
    z.object({ buildDuration: BuildBenchmark }),
  ],
  [
    'build',
    'corejs',
    'corejs-stats.json',
    CoreJsBenchmark.transform((coreJS) => ({ coreJS })),
  ],
  [
    'devServer',
    'dev-server',
    'dev-server-stats.json',
    z.object({ devServerStartUpDuration: DevServerStartupBenchmark }),
  ],
  [
    'browserBaseline',
    'browser-baseline',
    'browser-baseline-stats.json',
    BrowserBaselineBenchmark.transform((browserBaseline) => ({
      browserBaseline,
    })),
  ],
  [
    'dependencies',
    'node-engines',
    'node-engines-stats.json',
    MinimumNodeVersionBenchmark.nullable().transform((minimumNodeVersion) => ({
      minimumNodeVersion: minimumNodeVersion ?? undefined,
    })),
  ],
  [
    'dependencies',
    'e18e',
    'framework-dependency-stats.json',
    DependencyCountBenchmark.pick({ coreDev: true, coreProd: true }).transform(
      (dependencyCounts) => ({ dependencyCounts }),
    ),
  ],
  [
    'dependencies',
    'e18e',
    'first-party-dependency-stats.json',
    DependencyCountBenchmark.pick({
      firstPartyDev: true,
      firstPartyProd: true,
      firstPartyDuplicate: true,
    }).transform((dependencyCounts) => ({ dependencyCounts })),
  ],
  [
    'dependencies',
    'e18e',
    'e18e-stats.json',
    z
      .object({
        stats: z.object({
          dependencyCount: z.object({
            production: z.number(),
            development: z.number(),
          }),
          installSize: z.number(),
          extraStats: z
            .array(
              z.object({
                name: z.string(),
                value: z.union([z.number(), z.string()]),
              }),
            )
            .optional(),
        }),
      })
      .transform(({ stats }) => ({
        dependencyCounts: {
          starterDev: { value: stats.dependencyCount.development },
          starterProd: { value: stats.dependencyCount.production },
          starterDuplicate: {
            value: stats.extraStats?.find(
              ({ name }) => name === 'duplicateDependencyCount',
            )?.value,
          },
          starterDependencyInstallSize: { value: stats.installSize },
        },
      }))
      .pipe(
        z.object({
          dependencyCounts: DependencyCountBenchmark.pick({
            starterDev: true,
            starterProd: true,
            starterDuplicate: true,
            starterDependencyInstallSize: true,
          }),
        }),
      ),
  ],
  [
    'ssrRequestThroughput',
    'ssr-request-throughput',
    'ci-stats.json',
    version.extend({ ssrThroughput: throughput }),
  ],
  ['ssrLoad', 'ssr-load', 'ci-stats.json', version.extend({ ssrLoad: load })],
  [
    'ssrRouterLinkLoad',
    'ssr-router-link-load',
    'ci-stats.json',
    version.extend({ ssrLoadRouterLinks: routerLoad }),
  ],
  [
    'clientSideRendered',
    'client-side-rendered',
    'ci-stats.json',
    browser.extend({ csrLighthouse }),
  ],
  [
    'serverSideRendered',
    'server-side-rendered',
    'ci-stats.json',
    browser.extend({ ssrLighthouse }),
  ],
  [
    'initialLoad',
    'initial-load',
    'ci-stats.json',
    browser.extend({ ssrInitialLoad: SSRInitialLoadBenchmark }),
  ],
] as const satisfies readonly (readonly [
  TestConfig['measurements'][number],
  string,
  string,
  z.ZodType,
])[]

export type BenchmarkArtifact = z.output<(typeof benchmarkArtifacts)[number][3]>

const runtimeArtifact = version.extend({
  browserVersion: z.string().min(1).optional(),
  timingMeasuredAt: z.iso.datetime(),
  runner: z.string().min(1),
  csrLighthouse: CSRLighthouseBenchmark.optional(),
  ssrLighthouse: SSRLighthouseBenchmark.optional(),
  ssrInitialLoad: SSRInitialLoadBenchmark.optional(),
  ssrThroughput: throughput.optional(),
  ssrLoad: load.optional(),
  ssrLoadRouterLinks: routerLoad.optional(),
})

export function writeRuntimeArtifact(
  packageName: string,
  frameworkVersion: string | undefined,
  measurement: Partial<z.input<typeof runtimeArtifact>>,
) {
  const file = benchmarkOutputPath(packageName, 'ci-stats.json')
  const previous = runtimeArtifact.safeParse(readJsonFile(file))
  writeJsonFile(
    file,
    runtimeArtifact.parse({
      ...(previous.success &&
        previous.data.frameworkVersion === frameworkVersion &&
        previous.data),
      ...measurement,
      frameworkVersion,
      runner: process.env.RUNNER_LABEL || 'local',
      timingMeasuredAt: new Date().toISOString(),
    }),
  )
}
