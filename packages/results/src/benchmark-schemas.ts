import { z } from 'zod'
import {
  type BenchmarkUnit,
  BenchmarkUnitOptions,
  FrameworkOptions,
  FrameworkProjectOptions,
  InitialLoadResourceOptions,
  PackagePathOptions,
} from './benchmark-types.ts'

const Project = z.object({
  path: z.enum(PackagePathOptions),
  packageJson: z.object({
    dependencies: z.record(z.string(), z.string()).optional(),
    devDependencies: z.record(z.string(), z.string()).optional(),
  }),
})

const BaseBenchmark = z.object({
  project: z.enum(FrameworkProjectOptions),
  name: z.string(),
})

const IterationMetricChange = z.object({
  /** Defaults to zero when the previous value is zero. */
  percentChange: z.number(),
  /** Signed difference in the metric's unit: current minus previous. */
  valueChange: z.number(),
})

const IterationVariance = z.object({
  comparedToMeasuredAt: z.iso.datetime().nullable(),
  mean: IterationMetricChange,
  median: IterationMetricChange,
  min: IterationMetricChange,
  max: IterationMetricChange,
})

const IterationSummary = z.object({
  unit: z.enum(BenchmarkUnitOptions),
  mean: z.number(),
  median: z.number(),
  min: z.number(),
  max: z.number(),
  variance: IterationVariance.optional(),
})

function createValueWithUnit(unit: BenchmarkUnit, value: z.ZodNumber) {
  return z.object({ value, unit: z.literal(unit).default(unit) })
}

function createIteration<T extends z.ZodType>(iteration: T) {
  return z
    .object({
      runs: z.number().int().positive(),
      iterations: z.array(iteration),
    })
    .refine((result) => result.iterations.length === result.runs, {
      message: 'Expected one iteration per run',
      path: ['iterations'],
    })
}

function createIterationSummary(unit: BenchmarkUnit) {
  return IterationSummary.extend({
    unit: z.literal(unit).default(unit),
  })
}

const DependencyCountBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('dependencyCount'),

  coreDev: createValueWithUnit('count', z.number().int().nonnegative()),
  firstPartyDev: createValueWithUnit('count', z.number().int().nonnegative()),
  starterDev: createValueWithUnit('count', z.number().int().nonnegative()),
  coreProd: createValueWithUnit('count', z.number().int().nonnegative()),
  firstPartyProd: createValueWithUnit('count', z.number().int().nonnegative()),
  starterProd: createValueWithUnit('count', z.number().int().nonnegative()),

  firstPartyDuplicate: createValueWithUnit(
    'count',
    z.number().int().nonnegative(),
  ),
  starterDuplicate: createValueWithUnit(
    'count',
    z.number().int().nonnegative(),
  ),

  starterNodeModuleSize: createValueWithUnit('bytes', z.number().nonnegative()),
  starterDependencyInstallSize: createValueWithUnit(
    'bytes',
    z.number().nonnegative(),
  ),
})

const BuildBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('build'),
  iterations: createIteration(
    z.object({
      coldDuration: createValueWithUnit('ms', z.number().nonnegative()),
      warmDuration: createValueWithUnit('ms', z.number().nonnegative()),
    }),
  ),
  coldDuration: createIterationSummary('ms'),
  warmDuration: createIterationSummary('ms'),
})

const InstallBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('install'),
  iterations: createIteration(
    z.object({
      duration: createValueWithUnit('ms', z.number().nonnegative()),
    }),
  ),
  duration: createIterationSummary('ms'),
})

const DevServerStartupBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('devServerStartup'),
  iterations: createIteration(
    z.object({
      duration: createValueWithUnit('ms', z.number().nonnegative()),
    }),
  ),
  duration: createIterationSummary('ms'),
})

const CoreJsBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('coreJs'),
  totalVendoredSize: createValueWithUnit(
    'bytes',
    z.number().int().nonnegative(),
  ),
  unnecessaryModules: z.array(z.string()),
})

const BrowserBaselineBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('browserBaseline'),
  baselineStatus: z.union([
    z.literal('high'),
    z.literal('low'),
    z.literal(false),
    z.null(),
  ]),
  baselineYear: z.number().nullable(),
  baselineReason: z.string().nullable(),
  baselineFeatureCount: createValueWithUnit('count', z.number().nonnegative()),
})

const MinimumNodeVersionBenchmark = BaseBenchmark.extend({
  project: z.literal('starter'),
  name: z.literal('minimumNodeVersion'),
  nodeVersion: z.string(),
  imposedBy: z.array(z.string()),
})

export const LighthouseInteractionTimingIteration = z.object({
  interactionLatency: createValueWithUnit('ms', z.number().nonnegative()),
  inputDelay: createValueWithUnit('ms', z.number().nonnegative()),
  processingDuration: createValueWithUnit('ms', z.number().nonnegative()),
  presentationDelay: createValueWithUnit('ms', z.number().nonnegative()),
})

export const LighthouseInteractionTimingSummary = z.object({
  interactionLatency: createIterationSummary('ms'),
  inputDelay: createIterationSummary('ms'),
  processingDuration: createIterationSummary('ms'),
  presentationDelay: createIterationSummary('ms'),
})

const CSRLighthouseBenchmark = BaseBenchmark.extend({
  project: z.literal('app'),
  name: z.literal('csrLighthouse'),
  iterations: createIteration(
    z.object({
      firstPaint: createValueWithUnit('ms', z.number().positive()),
      firstContentfulPaint: createValueWithUnit('ms', z.number().positive()),
      interaction: LighthouseInteractionTimingIteration,
    }),
  ),
  firstPaint: createIterationSummary('ms'),
  firstContentfulPaint: createIterationSummary('ms'),
  interaction: LighthouseInteractionTimingSummary,
})

const SSRLighthouseBenchmark = BaseBenchmark.extend({
  project: z.literal('app'),
  name: z.literal('ssrLighthouse'),
  iterations: createIteration(
    z.object({
      firstPaint: createValueWithUnit('ms', z.number().positive()),
      firstContentfulPaint: createValueWithUnit('ms', z.number().positive()),
      interaction: LighthouseInteractionTimingIteration,
    }),
  ),
  firstPaint: createIterationSummary('ms'),
  firstContentfulPaint: createIterationSummary('ms'),
  interaction: LighthouseInteractionTimingSummary,
})

const SSRInitialLoadBenchmark = BaseBenchmark.extend({
  project: z.literal('app'),
  name: z.literal('ssrInitialLoad'),
  resources: z.record(
    z.enum(InitialLoadResourceOptions),
    z.object({
      requestCount: createValueWithUnit(
        'requests',
        z.number().int().nonnegative(),
      ),
      transferSize: createValueWithUnit(
        'bytes',
        z.number().int().nonnegative(),
      ),
    }),
  ),
})

const SSRThroughputBenchmark = BaseBenchmark.extend({
  project: z.literal('app'),
  name: z.literal('ssrThroughput'),
  // Each measurement in throughput creates multiple request so we store summaries in our iterations to catch large changes
  iterations: createIteration(
    z.object({
      requestThroughput: createIterationSummary('ops/s'),
      latency: createIterationSummary('ms'),
      requests: createValueWithUnit('requests', z.number().int().nonnegative()),
    }),
  ),
  requestThroughput: createIterationSummary('ops/s'),
  latency: createIterationSummary('ms'),
  requests: createValueWithUnit('requests', z.number().int().nonnegative()),
  bodySize: createValueWithUnit('KiB', z.number().positive()),
  duplicationFactor: createValueWithUnit('ratio', z.number().nonnegative()),
})

const SSRLoadStage = z.object({
  connections: z.number().int().positive(),
  duration: createValueWithUnit('ms', z.number().positive()),
  requests: createValueWithUnit('requests', z.number().int().nonnegative()),
  errors: createValueWithUnit('errors', z.number().int().nonnegative()),
  requestsPerSecond: createValueWithUnit('requests', z.number().nonnegative()),
  bytesPerSecond: createValueWithUnit('bytes', z.number().nonnegative()),
  avgLatency: createValueWithUnit('ms', z.number().nonnegative()),
  p50Latency: createValueWithUnit('ms', z.number().nonnegative()),
  p75Latency: createValueWithUnit('ms', z.number().nonnegative()),
  p90Latency: createValueWithUnit('ms', z.number().nonnegative()),
  p99Latency: createValueWithUnit('ms', z.number().nonnegative()),
  maxLatency: createValueWithUnit('ms', z.number().nonnegative()),
})

const SSRLoadStageSummary = z.object({
  connections: z.number().int().positive(),
  requests: createIterationSummary('requests'),
  errors: createIterationSummary('errors'),
  requestsPerSecond: createIterationSummary('requests'),
  bytesPerSecond: createIterationSummary('bytes'),
  avgLatency: createIterationSummary('ms'),
  p50Latency: createIterationSummary('ms'),
  p75Latency: createIterationSummary('ms'),
  p90Latency: createIterationSummary('ms'),
  p99Latency: createIterationSummary('ms'),
  maxLatency: createIterationSummary('ms'),
})

const SSRLoadBenchmark = BaseBenchmark.extend({
  project: z.literal('app'),
  name: z.literal('ssrLoad'),
  // Each iteration runs all seven connection stages in order.
  iterations: createIteration(
    z.object({
      stage1: SSRLoadStage,
      stage2: SSRLoadStage,
      stage3: SSRLoadStage,
      stage4: SSRLoadStage,
      stage5: SSRLoadStage,
      stage6: SSRLoadStage,
      stage7: SSRLoadStage,
    }),
  ),
  representativeIterationIndex: z.number().int().nonnegative(),
  totalRequests: createValueWithUnit(
    'requests',
    z.number().int().nonnegative(),
  ),
  totalErrors: createValueWithUnit('errors', z.number().int().nonnegative()),
  stage1: SSRLoadStageSummary,
  stage2: SSRLoadStageSummary,
  stage3: SSRLoadStageSummary,
  stage4: SSRLoadStageSummary,
  stage5: SSRLoadStageSummary,
  stage6: SSRLoadStageSummary,
  stage7: SSRLoadStageSummary,
})

const SSRLoadRouterLinksBenchmark = SSRLoadBenchmark.extend({
  name: z.literal('ssrLoadRouterLinks'),
})

/**
 * A slimmed down version of the Benchmark Result Schema for the HTML Baseline
 */
export const HTMLBaselineBenchmarkResult = z.object({
  framework: z.literal('baseline-html'),
  timingMeasuredAt: z.iso.datetime(),
  projects: z.object({
    app: Project,
  }),
  runner: z.string(),

  // Benchmarks
  ssrThroughput: SSRThroughputBenchmark.optional(),
  ssrLoad: SSRLoadBenchmark.optional(),

  // Comes from packages/results/src/measurements-config.ts so leave as flexible type as this can change and is only needed as record
  configuration: z.record(z.string(), z.unknown()),
})

/**
 * Final Benchmark Result schema for all Meta-frameworks results
 */
export const MetaFrameworkBenchmarkResults = z.object({
  framework: z.enum(
    FrameworkOptions.filter((option) => option !== 'baseline-html'),
  ),
  timingMeasuredAt: z.iso.datetime(),
  projects: z.record(z.enum(FrameworkProjectOptions), Project),
  runner: z.string(),
  browserVersion: z.string(),
  frameworkVersion: z.string(),
  frameworkReleasedAt: z.string(),

  // Benchmarks (should always be options to support new benchmarks, removing old ones and frameworks that might not be able to complete one)
  dependencyCounts: DependencyCountBenchmark.optional(),
  buildDuration: BuildBenchmark.optional(),
  installDuration: InstallBenchmark.optional(),
  devServerStartUpDuration: DevServerStartupBenchmark.optional(),
  coreJS: CoreJsBenchmark.optional(),
  browserBaseline: BrowserBaselineBenchmark.optional(),
  minimumNodeVersion: MinimumNodeVersionBenchmark.optional(),
  csrLighthouse: CSRLighthouseBenchmark.optional(),
  ssrLighthouse: SSRLighthouseBenchmark.optional(),
  ssrInitialLoad: SSRInitialLoadBenchmark.optional(),
  ssrThroughput: SSRThroughputBenchmark.optional(),
  ssrLoad: SSRLoadBenchmark.optional(),
  ssrLoadRouterLinks: SSRLoadRouterLinksBenchmark.optional(),

  // Comes from packages/results/src/measurements-config.ts so leave as flexible type as this can change and is only needed as record
  configuration: z.record(z.string(), z.unknown()),
})
