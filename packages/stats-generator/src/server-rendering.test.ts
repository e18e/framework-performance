import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assembleServerRendering } from './server-rendering.ts'
import { SSRLighthouseBenchmark } from '@framework-performance/results/benchmark-schemas'
import { benchmarkArtifacts } from './benchmark-artifacts.ts'

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
    interactionWork: {
      workToCommit: value + 1,
      inputDelay: 0,
      processingDuration: value,
      renderingWork: 1,
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
  assert.deepEqual(result.interactionWork?.workToCommit, {
    unit: 'ms',
    mean: 3,
    median: 3,
    min: 2,
    max: 4,
  })
  assert.deepEqual(result.iterations.iterations[1].interactionWork, {
    workToCommit: { value: 4, unit: 'ms' },
    inputDelay: { value: 0, unit: 'ms' },
    processingDuration: { value: 3, unit: 'ms' },
    renderingWork: { value: 1, unit: 'ms' },
  })
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

test('accepts results without interaction work but requires it in new artifacts', () => {
  const result = assembleServerRendering(
    [1, 3].map((value) => ({
      firstPaint: value,
      firstContentfulPaint: value,
      interactionTests: {
        interactionLatency: value,
        inputDelay: 0,
        processingDuration: value,
        presentationDelay: 0,
      },
      interactionWork: {
        workToCommit: value,
        inputDelay: 0,
        processingDuration: value,
        renderingWork: 0,
      },
    })),
  )
  const { interactionWork: _interactionWork, ...stored } = result
  const legacy = {
    ...stored,
    iterations: {
      ...result.iterations,
      iterations: result.iterations.iterations.map(
        ({ interactionWork: _work, ...run }) => run,
      ),
    },
  }
  assert.equal(SSRLighthouseBenchmark.safeParse(legacy).success, true)

  const artifact = benchmarkArtifacts.find(
    ([name]) => name === 'ssrLighthouse',
  )![3]
  const parse = (value: unknown) =>
    artifact.safeParse({
      frameworkVersion: '1.0.0',
      ssrLighthouse: value,
    }).success
  assert.equal(parse(result), true)
  assert.equal(parse(legacy), false)
  assert.equal(parse(stored), false)
  assert.equal(
    parse({
      ...result,
      iterations: {
        ...result.iterations,
        iterations: [
          result.iterations.iterations[0],
          legacy.iterations.iterations[1],
        ],
      },
    }),
    false,
  )
  assert.equal(
    parse({ ...legacy, interactionWork: result.interactionWork }),
    false,
  )
})
