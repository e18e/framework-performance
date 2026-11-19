import { DependencyCountBenchmark } from '@framework-performance/results/benchmark-schemas'
import {
  getFrameworkDependencyCountsFromPackageMetadata,
  getFrameworkByPackage,
  parseArgs,
  benchmarkOutputPath,
  writeJsonFile,
} from './utils.ts'

async function main() {
  const { packageName, args } = parseArgs(
    'Usage: run-framework-dependency-scan <starter-package> [output-path]\nExample: run-framework-dependency-scan starter-astro',
  )
  const [requestedOutputPath] = args
  const { framework } = await getFrameworkByPackage(packageName)

  const outputPath =
    requestedOutputPath ??
    benchmarkOutputPath(packageName, 'framework-dependency-stats.json')
  const stats = getFrameworkDependencyCountsFromPackageMetadata(
    packageName,
    framework.frameworkPackage,
  )

  writeJsonFile(
    outputPath,
    DependencyCountBenchmark.pick({ coreDev: true, coreProd: true }).parse({
      coreDev: stats.developmentDependencyCount,
      coreProd: stats.productionDependencyCount,
    }),
  )
  console.info(`Saved framework dependency stats to ${outputPath}`)
}

main().catch((error) => {
  console.error('Framework dependency scan failed:', error)
  process.exit(1)
})
