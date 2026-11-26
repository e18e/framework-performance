import { runNodeEnginesScan } from '../benchmarks/node-engines/run-scan.ts'
import { getBenchmarkContext, requireMeasurements } from '../utils.ts'

async function main() {
  const { packageName, framework } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['minimumNodeVersion'])
  await runNodeEnginesScan(packageName, framework)
}

main().catch((error) => {
  console.error('Node engines scan failed:', error)
  process.exit(1)
})
