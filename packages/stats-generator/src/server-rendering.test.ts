import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assembleServerRendering } from './server-rendering.ts'
import { SSRLighthouseBenchmark } from '@framework-performance/results/benchmark-schemas'

test('assembles server rendering from exact raw browser measurements', () => {
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
  const result = assembleServerRendering(iterations)
  assert.deepEqual(
    result.iterations.iterations.map(({ firstPaint }) => firstPaint),
    [
      { value: 1, unit: 'ms' },
      { value: 3, unit: 'ms' },
    ],
  )
  assert.equal(result.firstPaint.mean, 2)
  assert.equal(
    SSRLighthouseBenchmark.safeParse({
      ...result,
      iterations: undefined,
    }).success,
    false,
  )
  assert.equal(
    SSRLighthouseBenchmark.safeParse({
      ...result,
      iterations: { runs: 1, iterations: result.iterations.iterations },
    }).success,
    false,
  )
})
