import { runBuildBenchmark } from '../benchmarks/build/run-benchmark.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['buildDuration', 'coreJS', 'browserBaseline'])
  await runBuildBenchmark(packageName, framework, projectConfig)
}

main().catch((error) => {
  console.error('Build benchmark failed:', error)
  process.exit(1)
})
