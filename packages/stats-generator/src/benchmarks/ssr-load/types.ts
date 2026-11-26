import type {
  SSRLoadBenchmark,
  SSRLoadStage,
  SSRLoadRouterLinksBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import type { z } from 'zod'
export type SSRLoadStageStats = z.output<typeof SSRLoadStage>
export type SSRLoadSweep = SSRLoadStageStats[]

export interface SSRLoadBenchmarkResult {
  name: string
  displayName: string
  package: string
  tests: z.infer<typeof SSRLoadBenchmark | typeof SSRLoadRouterLinksBenchmark>
}
