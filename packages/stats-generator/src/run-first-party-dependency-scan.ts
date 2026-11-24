import { DependencyCountBenchmark } from '@framework-performance/results/benchmark-schemas'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  getFirstPartyDependencyManifest,
  getFirstPartyDependencyStats,
} from './first-party-dependencies.ts'
import { packagesDir } from './constants.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  writeJsonFile,
} from './utils.ts'

async function main() {
  const { packageName } = await getBenchmarkContext(
    'Usage: run-first-party-dependency-scan <starter-package>',
  )
  const manifest = getFirstPartyDependencyManifest(packageName)
  const outputPath = benchmarkOutputPath(
    packageName,
    'first-party-dependency-stats.json',
  )
  const lockfile = await readFile(
    join(packagesDir, packageName, 'pnpm-lock.yaml'),
    'utf-8',
  )
  const stats = getFirstPartyDependencyStats(manifest, lockfile)
  writeJsonFile(outputPath, {
    dependencyCounts: DependencyCountBenchmark.pick({
      firstPartyDev: true,
      firstPartyProd: true,
      firstPartyDuplicate: true,
    }).parse({
      firstPartyDev: stats.developmentDependencyCount,
      firstPartyProd: stats.productionDependencyCount,
      firstPartyDuplicate: stats.duplicateDependencyCount,
    }),
  })
  console.info(`Saved first-party dependency stats to ${outputPath}`)
}

main().catch((error) => {
  console.error('First-party dependency scan failed:', error)
  process.exit(1)
})
