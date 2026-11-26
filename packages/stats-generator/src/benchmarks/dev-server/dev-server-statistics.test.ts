import assert from 'node:assert/strict'
import test from 'node:test'
import { createDevServerStats } from './dev-server-statistics.ts'
import { DevServerStartupBenchmark } from '@framework-performance/results/benchmark-schemas'

test('startup results retain iterations and summarize measurements', () => {
  assert.deepEqual(createDevServerStats([10, 20, 30]), {
    name: 'devServerStartup',
    project: 'starter',
    iterations: {
      runs: 3,
      iterations: [
        { duration: { value: 10, unit: 'ms' } },
        { duration: { value: 20, unit: 'ms' } },
        { duration: { value: 30, unit: 'ms' } },
      ],
    },
    duration: { unit: 'ms', mean: 20, median: 20, min: 10, max: 30 },
  })
})

test('startup schema requires its test name, complete runs, and statistics', () => {
  const result = createDevServerStats([10, 20, 30])
  for (const patch of [
    { name: undefined },
    { name: 'coldBuild' },
    { iterations: { ...result.iterations, runs: 2 } },
    { iterations: undefined },
    { duration: { unit: 'ms', mean: 20, min: 10, max: 30 } },
  ]) {
    assert.equal(
      DevServerStartupBenchmark.safeParse({ ...result, ...patch }).success,
      false,
    )
  }
  assert.throws(() => createDevServerStats([]))
})
