import { benchmarkArtifacts } from './benchmark-artifacts.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assembleRequestThroughput,
  createRequestThroughputIteration,
} from './request-throughput.ts'

const responseMetrics = {
  bodySize: { value: 20_736, unit: 'bytes' as const },
  duplicationFactor: { value: 1.25, unit: 'ratio' as const },
}
function fixture() {
  return assembleRequestThroughput(
    [
      createRequestThroughputIteration([100.125, 300.375, 500.625], [1, 2, 9]),
      createRequestThroughputIteration([1000.125], [0.25]),
    ],
    responseMetrics,
  )
}

test('keeps per-run distributions and validates the total request count', () => {
  const result = fixture()
  const artifact = benchmarkArtifacts.find(
    ([measurement]) => measurement === 'ssrThroughput',
  )![3]
  assert.equal(
    artifact.safeParse({
      frameworkVersion: '1.0.0',
      ssrThroughput: { ...result, requests: { value: 5, unit: 'requests' } },
    }).success,
    false,
  )
  assert.deepEqual(result.requests, { value: 4, unit: 'requests' })
  assert.deepEqual(result.iterations.iterations[0].latency, {
    unit: 'ms',
    mean: 4,
    median: 2,
    min: 1,
    max: 9,
  })
  assert.equal(result.requestThroughput.mean, 650.25)
  assert.equal(result.latency.mean, 2.125)
  assert.equal(result.latency.median, 2.125)
  assert.equal('avgLatency' in result, false)
  assert.equal('medianLatency' in result, false)
  assert.equal('medianLatency' in result.iterations.iterations[0], false)
  assert.equal(JSON.stringify(result).includes('throughputSamples'), false)
  assert.equal(JSON.stringify(result).includes('latencySamplesMs'), false)
})
