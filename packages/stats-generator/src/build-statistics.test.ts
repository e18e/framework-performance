import assert from 'node:assert/strict'
import test from 'node:test'
import { createBuildStats } from './build-statistics.ts'
import { BuildBenchmark } from '@framework-performance/results/benchmark-schemas'

test('build result pairs cold and warm samples and reports separate summaries', () => {
  const result = createBuildStats([10, 20], [5, 6])
  assert.deepEqual(result.iterations, {
    runs: 2,
    iterations: [
      {
        coldDuration: { value: 10, unit: 'ms' },
        warmDuration: { value: 5, unit: 'ms' },
      },
      {
        coldDuration: { value: 20, unit: 'ms' },
        warmDuration: { value: 6, unit: 'ms' },
      },
    ],
  })
  assert.equal(result.coldDuration.mean, 15)
  assert.equal(result.warmDuration.mean, 5.5)
  assert.throws(() => createBuildStats([10, 20], [5]), /counts differ/)
  assert.equal(
    BuildBenchmark.safeParse({ ...result, name: 'warmBuild' }).success,
    false,
  )
})
