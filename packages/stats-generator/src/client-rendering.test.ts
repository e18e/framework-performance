import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assembleClientRendering } from './client-rendering.ts'
import { CSRLighthouseBenchmark } from '@framework-performance/results/benchmark-schemas'

test('assembles client rendering from exact raw browser measurements', () => {
  const iterations = [1, 3].map((value) => ({
    firstPaint: value,
    firstContentfulPaint: value + 1,
    interactionTests: {
      interactionLatency: value,
      inputDelay: 0,
      processingDuration: value,
      presentationDelay: 0,
    },
  }))
  const result = assembleClientRendering(iterations)
  assert.deepEqual(
    result.iterations.iterations.map(({ firstPaint }) => firstPaint),
    [
      { value: 1, unit: 'ms' },
      { value: 3, unit: 'ms' },
    ],
  )
  assert.equal(result.firstPaint.mean, 2)
  assert.equal(
    CSRLighthouseBenchmark.safeParse({
      ...result,
      iterations: undefined,
    }).success,
    false,
  )
  assert.equal(
    CSRLighthouseBenchmark.safeParse({
      ...result,
      iterations: { runs: 1, iterations: result.iterations.iterations },
    }).success,
    false,
  )
})
