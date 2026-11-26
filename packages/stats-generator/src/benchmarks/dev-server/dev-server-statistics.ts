import { summarizeMetric } from '../shared/sample-statistics.ts'
import { DevServerStartupBenchmark } from '@framework-performance/results/benchmark-schemas'

export function createDevServerStats(samples: number[]) {
  return DevServerStartupBenchmark.parse({
    name: 'devServerStartup',
    project: 'starter',
    iterations: {
      runs: samples.length,
      iterations: samples.map((timeMs) => ({
        duration: { value: timeMs, unit: 'ms' },
      })),
    },
    duration: summarizeMetric(samples),
  })
}
