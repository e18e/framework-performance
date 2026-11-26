import { summarizeMetric } from '../shared/sample-statistics.ts'
import { BuildBenchmark } from '@framework-performance/results/benchmark-schemas'

export function createBuildStats(cold: number[], warm: number[]) {
  if (cold.length !== warm.length)
    throw new Error('Cold and warm build counts differ')

  return BuildBenchmark.parse({
    name: 'build',
    project: 'starter',
    iterations: {
      runs: cold.length,
      iterations: cold.map((value, index) => ({
        coldDuration: { value, unit: 'ms' },
        warmDuration: { value: warm[index], unit: 'ms' },
      })),
    },
    coldDuration: summarizeMetric(cold),
    warmDuration: summarizeMetric(warm),
  })
}
