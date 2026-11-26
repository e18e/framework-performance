import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { InitialLoadResourceType } from '@framework-performance/results/benchmark-schemas'
import { readBenchmarkResult } from '@framework-performance/results/storage'
import { frameworksConfig } from '../../frameworks.ts'
import { processCIStats } from '../../save-ci-stats.ts'

test('CI requires configured initial load results and validates complete measurements', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'initial-load-ci-'))
  const framework = frameworksConfig.find(
    (framework) => framework.name === 'astro',
  )!
  const configured = {
    ...framework,
    starter: undefined,
    measurements: ['ssrInitialLoad' as const],
  }
  const options = {
    validateOnly: true,
    frameworks: [configured],
  }
  const path = join(
    directory,
    'ssrInitialLoad-stats-astro',
    'ssrInitialLoad-stats.json',
  )
  const resources = Object.fromEntries(
    InitialLoadResourceType.options.map((key) => [
      key,
      {
        requestCount: { value: 0, unit: 'requests' },
        transferSize: { value: 0, unit: 'bytes' },
      },
    ]),
  )
  const previous = readBenchmarkResult('astro')!
  const artifact = {
    frameworkVersion: previous.frameworkVersion,
    ssrInitialLoad: {
      name: 'ssrInitialLoad',
      project: 'app',
      resources,
    },
  }
  try {
    mkdirSync(join(directory, 'prepared-results'))
    writeFileSync(
      join(directory, 'prepared-results', 'astro.json'),
      JSON.stringify({
        framework: 'astro',
        frameworkVersion: previous.frameworkVersion,
        frameworkReleasedAt: previous.frameworkReleasedAt,
        projects: previous.projects,
        timingMeasuredAt: previous.timingMeasuredAt,
        runner: previous.runner,
        browserVersion: 'Google Chrome 156',
      }),
    )
    await assert.rejects(
      processCIStats(directory, options),
      /Missing ssrInitialLoad for astro/,
    )
    mkdirSync(join(directory, 'ssrInitialLoad-stats-astro'))
    writeFileSync(path, JSON.stringify(artifact))
    const results = await processCIStats(directory, options)
    const result = results.get('astro')
    assert.ok(result && result.framework !== 'baseline-html')
    assert.equal(result.browserVersion, 'Google Chrome 156')
    assert.deepEqual(result.ssrInitialLoad, artifact.ssrInitialLoad)
    assert.equal(result.frameworkVersion, artifact.frameworkVersion)
    writeFileSync(path, JSON.stringify({ ...artifact, ssrInitialLoad: {} }))
    await assert.rejects(processCIStats(directory, options))
    writeFileSync(path, '{')
    await assert.rejects(
      processCIStats(directory, options),
      /Invalid artifact: .*ssrInitialLoad-stats\.json/,
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
