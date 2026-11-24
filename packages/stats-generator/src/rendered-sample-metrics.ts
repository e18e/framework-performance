import {
  CSRLighthouseBenchmark,
  SSRLighthouseBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import type { RenderedTestSample } from './types.ts'

export function renderedSampleMetrics(sample: RenderedTestSample) {
  const timing = sample.interactionTests
  const work = sample.interactionWork
  return {
    firstPaint: { value: sample.firstPaint, unit: 'ms' },
    firstContentfulPaint: { value: sample.firstContentfulPaint, unit: 'ms' },
    interaction: {
      interactionLatency: { value: timing.interactionLatency, unit: 'ms' },
      inputDelay: { value: timing.inputDelay, unit: 'ms' },
      processingDuration: { value: timing.processingDuration, unit: 'ms' },
      presentationDelay: { value: timing.presentationDelay, unit: 'ms' },
    },
    interactionWork: {
      workToCommit: { value: work.workToCommit, unit: 'ms' },
      inputDelay: { value: work.inputDelay, unit: 'ms' },
      processingDuration: { value: work.processingDuration, unit: 'ms' },
      renderingWork: { value: work.renderingWork, unit: 'ms' },
    },
  }
}

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
export const measuredCSRLighthouse = CSRLighthouseBenchmark.refine(
  hasInteractionWork,
  interactionWorkError,
)
export const measuredSSRLighthouse = SSRLighthouseBenchmark.refine(
  hasInteractionWork,
  interactionWorkError,
)
