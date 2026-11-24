import type { z } from 'zod'
import type { CSRLighthouseBenchmark } from '@framework-performance/results/benchmark-schemas'
import type { InteractionTiming } from '../types.ts'
import type { InteractionWork } from '../interaction-work.ts'

export interface ClientSideRenderedRunResult {
  firstPaint: number | null
  firstContentfulPaint: number | null
  interaction: InteractionTiming | null
  interactionWork: InteractionWork | null
}

export interface ClientSideRenderedBenchmarkResult {
  name: string
  displayName: string
  package: string
  clientSideRendered: z.infer<typeof CSRLighthouseBenchmark>
}
