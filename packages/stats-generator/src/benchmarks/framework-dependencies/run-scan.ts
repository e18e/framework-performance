import { DependencyCountBenchmark } from '@framework-performance/results/benchmark-schemas'
import { getFrameworkDependencyCountsFromPackageMetadata } from '../../utils/package-metadata.ts'
import { benchmarkOutputPath } from '../../utils/paths.ts'
import { writeJsonFile } from '../../utils/files.ts'

import type { FrameworkConfig } from '../../types.ts'

export async function runFrameworkDependencyScan(
  packageName: string,
  framework: FrameworkConfig,
) {
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
