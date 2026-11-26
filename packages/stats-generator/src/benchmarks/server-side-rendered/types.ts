import type { z } from 'zod'
import type { SSRLighthouseBenchmark } from '@framework-performance/results/benchmark-schemas'
import type { InteractionTiming } from '../../types.ts'
import type { InteractionWork } from '../../interaction-work.ts'
export interface ServerSideRenderedRunResult {
  firstPaint: number | null
  firstContentfulPaint: number | null
  interaction: InteractionTiming | null
  interactionWork: InteractionWork | null
}

export interface ServerSideRenderedBenchmarkResult {
  name: string
  displayName: string
  package: string
  serverSideRendered: z.infer<typeof SSRLighthouseBenchmark>
}
