import { runInstallBenchmark } from '../benchmarks/install/run-benchmark.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['installDuration', 'dependencyCounts'])
  await runInstallBenchmark(packageName, framework)
}

main().catch((error) => {
  console.error('Install benchmark failed:', error)
  process.exit(1)
})
