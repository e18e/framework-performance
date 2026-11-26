import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getFirstPartyDependencyStats,
  validateFirstPartyDependencyManifest,
} from './first-party-dependencies.ts'
import { e18eStats } from '../../scripts/format-e18e-stats.ts'

test('derives starter dependency metrics from e18e output', () => {
  const stats = e18eStats.parse({
    stats: {
      name: 'fixture',
      version: '1.0.0',
      installSize: 1234,
      dependencyCount: { production: 2, development: 3 },
      extraStats: [
        { name: 'otherStat', value: 4 },
        { name: 'duplicateDependencyCount', value: 5 },
      ],
    },
    messages: [],
  })

  assert.deepEqual(stats, {
    dependencyCounts: {
      starterProd: { value: 2, unit: 'count' },
      starterDev: { value: 3, unit: 'count' },
      starterDuplicate: { value: 5, unit: 'count' },
      starterDependencyInstallSize: { value: 1234, unit: 'bytes' },
    },
  })
})

const lockfile = `
importers:
  .:
    dependencies:
      framework:
        specifier: 1.0.0
        version: 1.0.0(peer@2.0.0)
      unrelated:
        specifier: 1.0.0
        version: 1.0.0
    devDependencies:
      framework-tool:
        specifier: 1.0.0
        version: 1.0.0
packages:
  framework@1.0.0: {}
  framework-tool@1.0.0: {}
  peer@2.0.0: {}
  shared@1.0.0: {}
  shared@2.0.0: {}
  optional@1.0.0: {}
  unrelated@1.0.0: {}
snapshots:
  framework@1.0.0(peer@2.0.0):
    dependencies:
      peer: 2.0.0
      shared: 1.0.0
      shared-alias: shared@1.0.0
      framework-tool: 1.0.0
    optionalDependencies:
      optional: 1.0.0
  framework-tool@1.0.0:
    dependencies:
      shared: 2.0.0
  peer@2.0.0: {}
  shared@1.0.0: {}
  shared@2.0.0: {}
  optional@1.0.0: {}
  unrelated@1.0.0: {}
`

test('counts the first-party graph within the starter lockfile', () => {
  assert.deepEqual(
    getFirstPartyDependencyStats(
      {
        dependencies: { framework: '1.0.0' },
        devDependencies: { 'framework-tool': '1.0.0' },
      },
      lockfile,
    ),
    {
      productionDependencyCount: { value: 1, unit: 'count' },
      developmentDependencyCount: { value: 1, unit: 'count' },
      duplicateDependencyCount: { value: 1, unit: 'count' },
    },
  )
})

test('rejects a first-party manifest that is out of sync with the lockfile', () => {
  assert.throws(
    () =>
      getFirstPartyDependencyStats(
        { dependencies: { framework: '2.0.0' } },
        lockfile,
      ),
    /Lockfile is out of sync for dependencies.framework/,
  )
})

test('accepts a first-party manifest that matches direct starter dependencies', () => {
  assert.deepEqual(
    validateFirstPartyDependencyManifest(
      {
        dependencies: { framework: '1.0.0' },
        devDependencies: { 'framework-tool': '2.0.0' },
      },
      {
        dependencies: { framework: '1.0.0', thirdParty: '3.0.0' },
        devDependencies: { 'framework-tool': '2.0.0' },
      },
    ),
    [],
  )
})

test('reports entries without an exact section, key, and version match', () => {
  assert.deepEqual(
    validateFirstPartyDependencyManifest(
      {
        dependencies: {
          framework: '0.9.0',
          'framework-tool': '2.0.0',
          transitive: '1.0.0',
        },
        devDependencies: { framework: '1.0.0' },
      },
      {
        dependencies: { framework: '1.0.0' },
        devDependencies: { 'framework-tool': '2.0.0' },
      },
    ),
    [
      'dependencies.framework is 0.9.0; starter has 1.0.0',
      'dependencies.framework-tool is 2.0.0; starter has no matching entry',
      'dependencies.transitive is 1.0.0; starter has no matching entry',
      'devDependencies.framework is 1.0.0; starter has no matching entry',
    ],
  )
})

test('reports invalid manifest structure', () => {
  assert.deepEqual(validateFirstPartyDependencyManifest(null, {}), [
    'must be a JSON object',
  ])
  assert.deepEqual(
    validateFirstPartyDependencyManifest(
      {
        dependencies: [],
        metadata: {},
      },
      {},
    ),
    [
      'contains unsupported key(s): metadata',
      'dependencies must be an object of package names and versions',
      'devDependencies must be an object of package names and versions',
    ],
  )
})
