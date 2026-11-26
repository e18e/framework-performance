import { runCoreJsScan } from '../benchmarks/core-js/run-scan.ts'
import { getBenchmarkContext, requireMeasurements } from '../utils.ts'

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['coreJS'])
  await runCoreJsScan(packageName, framework, projectConfig)
}

main().catch((error) => {
  console.error('Core-js scan failed:', error)
  process.exit(1)
})
