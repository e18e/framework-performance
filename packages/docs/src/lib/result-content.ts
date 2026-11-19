import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { getLoadPeakStage } from '@framework-performance/results/selection'
import type { BenchmarkResult } from '@framework-performance/results/benchmark-schemas'
import { frameworksConfig } from '@framework-performance/results/frameworks-config'

function formatTime(value: {
  duration: { median: number; min: number; max: number }
  iterations: { duration: { value: number } }[]
}) {
  return {
    medianMs: value.duration.median,
    minMs: value.duration.min,
    maxMs: value.duration.max,
    samplesMs: value.iterations.map((run) => run.duration.value),
  }
}
function interactionValues(
  timings: NonNullable<
    MetaFrameworkResult['csrLighthouse']
  >['iterations']['iterations'][number]['interaction'],
) {
  return {
    interactionLatency: timings.interactionLatency.value,
    inputDelay: timings.inputDelay.value,
    processingDuration: timings.processingDuration.value,
    presentationDelay: timings.presentationDelay.value,
  }
}

export function formatThroughput(
  value: NonNullable<BenchmarkResult['ssrThroughput']>,
) {
  return {
    ...value,
    requestThroughputRange: value.requestThroughput,
    latencyRange: value.latency,
    requestThroughput: value.requestThroughput.median,
    latency: value.latency.median,
    latencyUnit: value.latency.unit,
  }
}

function formatLoad(
  value: NonNullable<MetaFrameworkResult['ssrLoad' | 'ssrLoadRouterLinks']>,
) {
  const sweep = value.iterations.iterations[value.representativeIterationIndex]!
  const representativeSweep = SSRLoadStageOptions.map((key) => sweep[key])
  return {
    ...value,
    representativeSweep,
    representativePeak: getLoadPeakStage(representativeSweep),
    stages: SSRLoadStageOptions.map((key) => {
      const stage = value[key]
      return {
        connections: stage.connections,
        latencyRanges: {
          p75Latency: stage.p75Latency,
          p90Latency: stage.p90Latency,
          p99Latency: stage.p99Latency,
        },
        requests: stage.requests.median,
        errors: stage.errors.median,
        requestThroughput: stage.requestsPerSecond.median,
        avgLatency: stage.avgLatency.median,
        p50Latency: stage.p50Latency.median,
        p75Latency: stage.p75Latency.median,
        p90Latency: stage.p90Latency.median,
        p99Latency: stage.p99Latency.median,
        maxLatency: stage.maxLatency.median,
        byteThroughput: stage.bytesPerSecond.median,
      }
    }),
  }
}

type MetaFrameworkResult = Exclude<
  BenchmarkResult,
  { framework: 'baseline-html' }
>

export function formatLighthouse(
  value: NonNullable<MetaFrameworkResult['csrLighthouse' | 'ssrLighthouse']>,
) {
  const medianRun = [...value.iterations.iterations].sort(
    (a, b) =>
      a.interaction.interactionLatency.value -
      b.interaction.interactionLatency.value,
  )[Math.floor(value.iterations.runs / 2)]!
  return {
    firstPaintRange: value.firstPaint,
    firstContentfulPaintRange: value.firstContentfulPaint,
    firstPaint: value.firstPaint.median,
    firstContentfulPaint: value.firstContentfulPaint.median,
    interactionTests: {
      ...value.interaction,
      ...interactionValues(medianRun.interaction),
    },
  }
}

export function prepareRuntimeResult(result: BenchmarkResult) {
  const framework = frameworksConfig.find((f) => f.name === result.framework)!
  const meta = result.framework !== 'baseline-html' ? result : undefined
  const throughput = result.ssrThroughput
  return {
    frameworkVersion: result.frameworkVersion,
    releasedAt: result.frameworkReleasedAt,
    name: framework.displayName,
    package: framework.app!.package,
    ssrRequestThroughput: throughput && formatThroughput(throughput),
    ssrLoad: result.ssrLoad && formatLoad(result.ssrLoad),
    ssrRouterLinkLoad:
      meta?.ssrLoadRouterLinks && formatLoad(meta.ssrLoadRouterLinks),
    clientSideRendered:
      meta?.csrLighthouse && formatLighthouse(meta.csrLighthouse),
    initialLoad: meta?.ssrInitialLoad,
    serverSideRendered:
      meta?.ssrLighthouse && formatLighthouse(meta.ssrLighthouse),
  }
}

export function prepareStarterResult(result: MetaFrameworkResult) {
  const framework = frameworksConfig.find((f) => f.name === result.framework)!
  const {
    dependencyCounts: dependencies,
    buildDuration: build,
    installDuration: install,
    devServerStartUpDuration: devServer,
  } = result
  return {
    frameworkVersion: result.frameworkVersion,
    releasedAt: result.frameworkReleasedAt,
    name: framework.displayName,
    package: framework.starter!.package,
    productionDependencyCount: dependencies?.starterProd,
    developmentDependencyCount: dependencies?.starterDev,
    firstPartyDependencies: dependencies && {
      productionDependencyCount: dependencies.firstPartyProd,
      developmentDependencyCount: dependencies.firstPartyDev,
      duplicateDependencyCount: dependencies.firstPartyDuplicate,
    },
    install: install && {
      duration: install.duration,
      nodeModulesSize: dependencies?.starterNodeModuleSize,
    },
    duplicateDependencyCount: dependencies?.starterDuplicate,
    dependencyInstallSize: dependencies?.starterDependencyInstallSize,
    minimumNodeVersion: result.minimumNodeVersion?.nodeVersion,
    minimumNodeVersionImposedBy: result.minimumNodeVersion?.imposedBy,
    frameworkDependencies: dependencies && {
      productionDependencyCount: dependencies.coreProd,
      developmentDependencyCount: dependencies.coreDev,
    },
    vendoredCoreJsSize: result.coreJS?.totalVendoredSize,
    vendoredCoreJsUnnecessaryModules: result.coreJS?.unnecessaryModules,
    browserBaseline: result.browserBaseline,
    coldBuild:
      build &&
      formatTime({
        duration: build.coldDuration,
        iterations: build.iterations.iterations.map(({ coldDuration }) => ({
          duration: coldDuration,
        })),
      }),
    warmBuild:
      build &&
      formatTime({
        duration: build.warmDuration,
        iterations: build.iterations.iterations.map(({ warmDuration }) => ({
          duration: warmDuration,
        })),
      }),
    devServer:
      devServer &&
      formatTime({
        duration: devServer.duration,
        iterations: devServer.iterations.iterations,
      }),
  }
}
