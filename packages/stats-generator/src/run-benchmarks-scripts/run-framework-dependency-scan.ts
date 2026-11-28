import { runFrameworkDependencies } from '../benchmarks/framework-dependencies/run-framework-dependencies.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'
import { writeJsonFile } from '../utils/files.ts'
import { benchmarkOutputPath } from '../utils/paths.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['dependencyCounts'])
  const dependencyCounts = runFrameworkDependencies(
    packageName,
    framework.frameworkPackage,
  )

  writeJsonFile(
    benchmarkOutputPath(packageName, 'framework-dependency-stats.json'),
    { dependencyCounts },
  )
}

main().catch((error) => {
  console.error('Framework dependency scan failed:', error)
  process.exit(1)
})
