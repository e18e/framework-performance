import { DependencyCountBenchmark } from '@framework-performance/results/benchmark-schemas'
import {
  getFrameworkDependencyCountsFromPackageMetadata,
  getBenchmarkContext,
  requireMeasurements,
  benchmarkOutputPath,
  writeJsonFile,
} from './utils.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['dependencyCounts'])

  const outputPath = benchmarkOutputPath(
    packageName,
    'framework-dependency-stats.json',
  )
  const stats = getFrameworkDependencyCountsFromPackageMetadata(
    packageName,
    framework.frameworkPackage,
  )

  writeJsonFile(outputPath, {
    dependencyCounts: DependencyCountBenchmark.pick({
      coreDev: true,
      coreProd: true,
    }).parse({
      coreDev: stats.developmentDependencyCount,
      coreProd: stats.productionDependencyCount,
    }),
  })
  console.info(`Saved framework dependency stats to ${outputPath}`)
}

main().catch((error) => {
  console.error('Framework dependency scan failed:', error)
  process.exit(1)
})
