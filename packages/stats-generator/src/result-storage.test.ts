import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BenchmarkResultSchema } from '@framework-performance/results/benchmark-schemas'
import {
  readBenchmarkResult,
  resultPath,
  saveBenchmarkResult,
} from '@framework-performance/results/storage'

const version = '1.0.0'
const result = BenchmarkResultSchema.parse({
  framework: 'astro',
  frameworkVersion: version,
  frameworkReleasedAt: '2026-01-01T00:00:00.000Z',
  timingMeasuredAt: '2026-02-01T00:00:00.000Z',
  runner: 'local',
  browserVersion: 'Chrome/134',
  projects: {
    starter: { path: 'packages/starter-astro', packageJson: {} },
    app: { path: 'packages/app-astro', packageJson: {} },
  },
  configuration: { initialLoad: { path: '/initial-load' }, nodeEngines: null },
})

test('saving a benchmark result preserves metadata in latest and version history', () => {
  const root = mkdtempSync(join(tmpdir(), 'framework-result-'))
  try {
    assert.equal(readBenchmarkResult('astro', undefined, root), null)
    saveBenchmarkResult(result, root)
    assert.deepEqual(readBenchmarkResult('astro', undefined, root), result)
    assert.deepEqual(readBenchmarkResult('astro', version, root), result)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('invalid results fail before either result file is written', () => {
  const root = mkdtempSync(join(tmpdir(), 'framework-result-'))
  try {
    assert.throws(() =>
      saveBenchmarkResult({ ...result, timingMeasuredAt: '' }, root),
    )
    assert.equal(existsSync(resultPath('astro', undefined, root)), false)
    assert.equal(existsSync(resultPath('astro', version, root)), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
