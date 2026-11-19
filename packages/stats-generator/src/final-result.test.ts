import assert from 'node:assert/strict'
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  BenchmarkResultSchema,
  IterationSummary,
  BuildBenchmark,
  SSRLoadRouterLinksBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import { resultsRoot } from '@framework-performance/results/storage'

function assertStoredUnits(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      assertStoredUnits(child, `${path}.${index}`),
    )
    return
  }
  if (value === null || typeof value !== 'object') return
  const object = value as Record<string, unknown>
  if (
    ['mean', 'median', 'min', 'max'].every(
      (key) => typeof object[key] === 'number',
    )
  ) {
    assert.ok(
      IterationSummary.safeParse(object).success,
      `${path}: expected an explicit metric unit in the stored JSON`,
    )
  }
  for (const [key, child] of Object.entries(object))
    assertStoredUnits(child, `${path}.${key}`)
}

test('every persisted result and history validates with explicit metric units', () => {
  const files = [...globSync('**/*.json', { cwd: resultsRoot })]
  assert.ok(files.length > 0)
  for (const file of files) {
    const stored = JSON.parse(readFileSync(join(resultsRoot, file), 'utf8'))
    assert.deepEqual(stored, BenchmarkResultSchema.parse(stored), file)
    assertStoredUnits(stored, file)
  }
})

test('benchmark schemas require valid identities and measured metrics', () => {
  assert.equal(
    BuildBenchmark.safeParse({
      project: 'starter',
      name: 'build',
      iterations: {
        runs: 1,
        iterations: [{ coldDuration: 10, warmDuration: 2 }],
      },
    }).success,
    false,
  )
  assert.equal(
    SSRLoadRouterLinksBenchmark.safeParse({ name: 'ssrLoad' }).success,
    false,
  )
})
