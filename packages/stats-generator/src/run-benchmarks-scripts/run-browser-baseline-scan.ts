import { runBrowserBaselineScan } from '../benchmarks/browser-baseline/run-scan.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'

async function main() {
  const { packageName, projectConfig, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['browserBaseline'])
  await runBrowserBaselineScan(packageName, projectConfig)
}

main().catch((error) => {
  console.error('Browser baseline scan failed:', error)
  process.exit(1)
})
