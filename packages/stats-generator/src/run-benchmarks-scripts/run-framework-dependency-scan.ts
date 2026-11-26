import { runFrameworkDependencyScan } from '../benchmarks/framework-dependencies/run-scan.ts'
import { getBenchmarkContext, requireMeasurements } from '../utils.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['dependencyCounts'])
  await runFrameworkDependencyScan(packageName, framework)
}

main().catch((error) => {
  console.error('Framework dependency scan failed:', error)
  process.exit(1)
})
