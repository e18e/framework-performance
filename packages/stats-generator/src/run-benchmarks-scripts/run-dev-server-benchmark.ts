import { runDevServerBenchmark } from '../benchmarks/dev-server/run-benchmark.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['devServerStartUpDuration'])
  await runDevServerBenchmark(packageName, framework, projectConfig)
}

main().catch((error) => {
  console.error('Dev server benchmark failed:', error)
  process.exit(1)
})
