import { runFirstPartyDependencyScan } from '../benchmarks/first-party-dependencies/run-scan.ts'
import { getBenchmarkContext, requireMeasurements } from '../utils.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['dependencyCounts'])
  await runFirstPartyDependencyScan(packageName)
}

main().catch((error) => {
  console.error('First-party dependency scan failed:', error)
  process.exit(1)
})
