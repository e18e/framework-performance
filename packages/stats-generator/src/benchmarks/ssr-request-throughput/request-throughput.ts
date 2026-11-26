import type { z } from 'zod'
import { SSRThroughputBenchmark } from '@framework-performance/results/benchmark-schemas'
import { summarizeMetric } from '../../sample-statistics.ts'

export type RequestThroughputIteration = z.infer<
  typeof SSRThroughputBenchmark
>['iterations']['iterations'][number]

export function createRequestThroughputIteration(
  throughputSamples: number[],
  latencySamplesMs: number[],
): RequestThroughputIteration {
  if (throughputSamples.length !== latencySamplesMs.length) {
    throw new Error(
      'Expected one throughput and latency sample per measured HTTP request',
    )
  }
  return SSRThroughputBenchmark.shape.iterations.shape.iterations.element.parse(
    {
      requestThroughput: summarizeMetric(throughputSamples),
      latency: summarizeMetric(latencySamplesMs),
      requests: { value: latencySamplesMs.length, unit: 'requests' },
    },
  )
}

type ResponseMetrics = Pick<
  z.infer<typeof SSRThroughputBenchmark>,
  'bodySize' | 'duplicationFactor'
>

export function assembleRequestThroughput(
  iterations: RequestThroughputIteration[],
  responseMetrics: ResponseMetrics,
) {
  return SSRThroughputBenchmark.parse({
    ...responseMetrics,
    name: 'ssrThroughput',
    project: 'app',
    iterations: { runs: iterations.length, iterations },
    requests: {
      value: iterations.reduce(
        (count, iteration) => count + iteration.requests.value,
        0,
      ),
      unit: 'requests',
    },
    requestThroughput: summarizeMetric(
      iterations.map((value) => value.requestThroughput.mean),
    ),
    latency: summarizeMetric(iterations.map((value) => value.latency.mean)),
  })
}
