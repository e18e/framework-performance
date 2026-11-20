import type {
  BenchmarkResult,
  CoreJsBenchmark,
  DependencyCountBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import type { z } from 'astro/zod'
import type { BrandVariant, ThemedValue } from './framework-logos'
import type { LineChartScaleId, LineChartTooltipId } from './line-chart-config'

export type ChartValueFormat = 'count' | 'mb' | 'kb' | 'kib' | 'ms' | 's'

export interface ChartDatum {
  id?: string
  name: string
  value: number
  range?: { min: number; median: number; max: number }
  version?: string
}

export interface ComparisonChartPayload {
  id?: string
  data: ChartDatum[]
  valueFormat: ChartValueFormat
  yAxisLabel: string
}

export interface VersionLineChartPayload {
  id: string
  title: string
  description?: string
  data: { id: string; name: string; value: number | null }[]
  valueFormat: ChartValueFormat
  yAxisLabel: string
}

export interface StackedAreaChartPayload {
  title: string
  data: { name: string; total: number | null; values: Record<string, number> }[]
  series: readonly {
    key: string
    label: string
    color: string
  }[]
  valueFormat: ChartValueFormat
  yAxisLabel: string
  totalLabel?: string
}

export interface LineComparisonPoint {
  x: string
  value: number | null
  version: string | null
  /** Spread across benchmark runs, shown in the detail tooltip. */
  range?: { min: number; median: number; max: number }
}

export interface LineComparisonSeries {
  id: string
  name: string
  /** Brand colour from `framework-logos.ts`. */
  color: ThemedValue
  /** `segmented` draws a broken line, e.g. for the Baseline HTML reference. */
  variant: BrandVariant
  points: LineComparisonPoint[]
}

export interface LineComparisonChartPayload extends MetricDefinition {
  scale: LineChartScaleId
  tooltip: LineChartTooltipId
  xValues: string[]
  series: LineComparisonSeries[]
}

export interface MetricDefinition {
  id: string
  title: string
  description?: string
  valueFormat: ChartValueFormat
  yAxisLabel: string
}

export interface PreparedComparisonChart extends ComparisonChartPayload {
  id: string
  title: string
  description?: string
  data: (ChartDatum & { id: string })[]
}

export type InteractionPhaseKey =
  'inputDelay' | 'processingDuration' | 'presentationDelay'

export type InteractionTimings = Partial<
  Record<InteractionPhaseKey | 'interactionLatency', number>
>

export type InteractionWorkPartKey =
  'inputDelay' | 'processingDuration' | 'renderingWork'

export type InteractionWorkTimings = Partial<
  Record<InteractionWorkPartKey | 'workToCommit', number>
>

/** One framework version's interaction work to commit split into its parts. */
export interface InteractionWorkHistoryDatum extends Record<
  InteractionWorkPartKey | 'workToCommit',
  number
> {
  id: string
  name: string
}

/** One framework version's interaction latency split into its phases. */
export interface InteractionHistoryDatum extends Record<
  InteractionPhaseKey | 'interactionLatency',
  number
> {
  id: string
  name: string
}

type DependencyCount = z.output<typeof DependencyCountBenchmark>['starterProd']
type DependencyCounts = {
  productionDependencyCount?: DependencyCount
  developmentDependencyCount?: DependencyCount
  duplicateDependencyCount?: DependencyCount
}

/** Measurement subset accepted by chart preparation; Astro collection records fit structurally. */
export interface ChartMeasurement {
  package?: string
  name?: string
  frameworkVersion?: string
  releasedAt?: string
  devServer?: {
    medianMs?: number
  }
  install?: {
    duration?: { mean?: number }
    nodeModulesSize?: z.output<
      typeof DependencyCountBenchmark
    >['starterNodeModuleSize']
  }
  frameworkDependencies?: DependencyCounts
  firstPartyDependencies?: DependencyCounts
  productionDependencyCount?: DependencyCount
  developmentDependencyCount?: DependencyCount
  duplicateDependencyCount?: DependencyCount
  clientSideRendered?: {
    firstPaint?: number
    firstContentfulPaint?: number
    interactionTests?: InteractionTimings
    interactionWork?: InteractionWorkTimings
  }
  coldBuild?: {
    medianMs?: number
  }
  warmBuild?: {
    medianMs?: number
  }
  vendoredCoreJsSize?: z.output<typeof CoreJsBenchmark>['totalVendoredSize']
  serverSideRendered?: {
    firstPaint?: number
    firstContentfulPaint?: number
    interactionTests?: InteractionTimings
    interactionWork?: InteractionWorkTimings
  }
  ssrRequestThroughput?: {
    requestThroughput?: number
    bodySize?: NonNullable<BenchmarkResult['ssrThroughput']>['bodySize']
    latency?: number
  }
  dependencyInstallSize?: z.output<
    typeof DependencyCountBenchmark
  >['starterDependencyInstallSize']
  ssrLoad?: SSRLoadMeasurements
  ssrRouterLinkLoad?: SSRLoadMeasurements
}

interface SSRLoadMeasurements {
  totalRequests?: NonNullable<BenchmarkResult['ssrLoad']>['totalRequests']
  stages?: {
    connections: number
    latencyRanges?: Partial<
      Record<
        'p75Latency' | 'p90Latency' | 'p99Latency',
        { min: number; median: number; max: number }
      >
    >
    p75Latency?: number
    p90Latency?: number
    p99Latency?: number
  }[]
}

/** Install charts require a completed install benchmark. */
export type InstallChartMeasurement = ChartMeasurement & {
  install?: {
    duration?: { median: number }
    nodeModulesSize?: z.output<
      typeof DependencyCountBenchmark
    >['starterNodeModuleSize']
  }
}
