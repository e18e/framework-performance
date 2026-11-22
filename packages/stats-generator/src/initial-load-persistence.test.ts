import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { InitialLoadResourceType } from '@framework-performance/results/benchmark-schemas'
import { readBenchmarkResult } from '@framework-performance/results/storage'
import { frameworksConfig } from './frameworks.ts'
import { processCIStats } from './save-ci-stats.ts'

test('CI requires, validates, and preserves initial load artifacts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'initial-load-ci-'))
  const framework = frameworksConfig.find(
    (framework) => framework.name === 'astro',
  )!
  const configured = {
    ...framework,
    starter: undefined,
    app: { ...framework.app!, measurements: ['ssrInitialLoad' as const] },
  }
  const options = {
    validateOnly: true,
    requireAllArtifacts: true,
    frameworks: [configured],
  }
  const path = join(directory, 'initial-load-stats-astro', 'ci-stats.json')
  const resources = Object.fromEntries(
    InitialLoadResourceType.options.map((key) => [
      key,
      {
        requestCount: { value: 0, unit: 'requests' },
        transferSize: { value: 0, unit: 'bytes' },
      },
    ]),
  )
  const artifact = {
    frameworkVersion: readBenchmarkResult('astro')?.frameworkVersion,
    browserVersion: 'Chrome/156',
    ssrInitialLoad: {
      name: 'ssrInitialLoad',
      project: 'app',
      resources,
    },
  }
  try {
    await assert.rejects(
      processCIStats(directory, options),
      /Missing or invalid measurement artifact/,
    )
    mkdirSync(join(directory, 'initial-load-stats-astro'))
    writeFileSync(path, JSON.stringify(artifact))
    const results = await processCIStats(directory, options)
    const result = results.get('astro')
    assert.ok(result && result.framework !== 'baseline-html')
    assert.deepEqual(result.ssrInitialLoad, artifact.ssrInitialLoad)
    assert.equal(result.frameworkVersion, artifact.frameworkVersion)
    writeFileSync(path, JSON.stringify({ ...artifact, ssrInitialLoad: {} }))
    await assert.rejects(processCIStats(directory, options))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
