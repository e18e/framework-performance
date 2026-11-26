import { SSRLoadStageOptions } from '@framework-performance/results/benchmark-types'
import { measurementsConfig } from '@framework-performance/results/measurements-config'
import {
  getLoadPeakStage,
  selectRepresentativeIteration,
} from '@framework-performance/results/selection'
import {
  SSRLoadBenchmark,
  SSRLoadRouterLinksBenchmark,
} from '@framework-performance/results/benchmark-schemas'
import { summarizeMetric } from '../shared/sample-statistics.ts'
import { getSSRLoadKind, type SSRLoadKind } from './config.ts'
import { setTimeout as delay } from 'node:timers/promises'
import autocannon from 'autocannon'
import type { SSRLoadStageStats, SSRLoadSweep } from './types.ts'

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

async function runStage(
  url: string,
  connections: number,
  durationSeconds: number,
): Promise<SSRLoadStageStats> {
  const result = await autocannon({
    url,
    connections,
    duration: durationSeconds,
    headers: { Accept: 'text/html,application/xhtml+xml' },
    timeout: durationSeconds + 5,
  })

  return measureLoadStage({
    connections,
    duration: round(result.duration * 1000),
    requests: result.requests.total,
    errors: result.errors + result.timeouts + result.non2xx,
    requestsPerSecond: round(result.requests.average),
    avgLatency: round(result.latency.average),
    p50Latency: round(result.latency.p50),
    p75Latency: round(result.latency.p75),
    p90Latency: round(result.latency.p90),
    p99Latency: round(result.latency.p99),
    maxLatency: round(result.latency.max),
    bytesPerSecond: round(result.throughput.average),
  })
}

type RawLoadStage = { [K in keyof SSRLoadStageStats]: number }

export function measureLoadStage(stage: RawLoadStage): SSRLoadStageStats {
  return {
    connections: stage.connections,
    duration: { value: stage.duration, unit: 'ms' },
    requests: { value: stage.requests, unit: 'requests' },
    errors: { value: stage.errors, unit: 'errors' },
    requestsPerSecond: { value: stage.requestsPerSecond, unit: 'requests' },
    avgLatency: { value: stage.avgLatency, unit: 'ms' },
    p50Latency: { value: stage.p50Latency, unit: 'ms' },
    p75Latency: { value: stage.p75Latency, unit: 'ms' },
    p90Latency: { value: stage.p90Latency, unit: 'ms' },
    p99Latency: { value: stage.p99Latency, unit: 'ms' },
    maxLatency: { value: stage.maxLatency, unit: 'ms' },
    bytesPerSecond: { value: stage.bytesPerSecond, unit: 'bytes' },
  }
}

export async function runLoadTest(
  url: string,
  measureStage: typeof runStage = runStage,
  pause: (ms: number) => Promise<void> = delay,
) {
  const kind = getSSRLoadKind()
  const {
    runs,
    stageConnections,
    stageDurationMs,
    warmupDurationMs,
    warmupAttempts,
    recoveryMs,
  } = measurementsConfig[kind]
  const samples: SSRLoadSweep[] = []
  for (let run = 1; run <= runs; run++) {
    if (run > 1) {
      console.info(
        `  Sweep ${run}/${runs}: recovering for ${recoveryMs / 1000}s`,
      )
      await pause(recoveryMs)
    }
    for (let attempt = 1; attempt <= warmupAttempts; attempt++) {
      console.info(
        `  Sweep ${run}/${runs}: warm-up ${attempt}/${warmupAttempts} for ${warmupDurationMs / 1000}s`,
      )
      const warmup = await measureStage(
        url,
        stageConnections[0],
        warmupDurationMs / 1000,
      )
      if (warmup.errors.value === 0 && warmup.requests.value > 0) break

      const details = `sweep ${run}/${runs}, attempt ${attempt}/${warmupAttempts}: ${warmup.requests.value} requests, ${warmup.errors.value} errors, ${warmup.duration.value}ms`
      if (attempt === warmupAttempts) {
        throw new Error(
          `SSR load warm-up failed (${details}); expected requests without errors after recovery.`,
        )
      }
      console.warn(
        `  Unhealthy warm-up (${details}); recovering for ${recoveryMs / 1000}s before retry.`,
      )
      await pause(recoveryMs)
    }
    const stages: SSRLoadStageStats[] = []
    for (const connections of stageConnections) {
      console.info(
        `  ${connections} connections for ${stageDurationMs / 1000}s`,
      )
      const stage = await measureStage(url, connections, stageDurationMs / 1000)
      console.info(
        `    ${stage.requests.value} requests, ${stage.errors.value} errors, ${stage.requestsPerSecond.value} req/s`,
      )
      stages.push(stage)
    }
    getLoadPeakStage(stages)
    samples.push(stages)
  }
  return summarizeBenchmarkSweeps(samples, kind)
}

export function summarizeBenchmarkSweeps(
  samples: readonly SSRLoadSweep[],
  kind: SSRLoadKind = 'ssrLoad',
) {
  const representativeIterationIndex = selectRepresentativeIteration(samples)
  const fields = [
    'requests',
    'errors',
    'requestsPerSecond',
    'avgLatency',
    'p50Latency',
    'p75Latency',
    'p90Latency',
    'p99Latency',
    'maxLatency',
    'bytesPerSecond',
  ] as const
  const connections = measurementsConfig[kind].stageConnections
  if (
    samples.some(
      (sweep) =>
        sweep.length !== connections.length ||
        sweep.some((stage, index) => stage.connections !== connections[index]),
    )
  )
    throw new Error('Expected matching worker stages in every sweep')
  const benchmark = {
    runner: process.env.RUNNER_OVERRIDE,
    project: 'app',
    iterations: {
      runs: samples.length,
      iterations: samples.map((sweep) =>
        Object.fromEntries(
          sweep.map((stage, index) => [SSRLoadStageOptions[index], stage]),
        ),
      ),
    },
    representativeIterationIndex,
    totalRequests: {
      value: samples.reduce(
        (sum, sweep) =>
          sum + sweep.reduce((count, stage) => count + stage.requests.value, 0),
        0,
      ),
      unit: 'requests',
    },
    totalErrors: {
      value: samples.reduce(
        (sum, sweep) =>
          sum + sweep.reduce((count, stage) => count + stage.errors.value, 0),
        0,
      ),
      unit: 'errors',
    },
    ...Object.fromEntries(
      connections.map((connections, index) => [
        `stage${index + 1}`,
        {
          connections,
          ...Object.fromEntries(
            fields.map((field) => [
              field,
              summarizeMetric(
                samples.map((sweep) => sweep[index]![field].value),
              ),
            ]),
          ),
        },
      ]),
    ),
  }
  return kind === 'ssrLoad'
    ? SSRLoadBenchmark.parse({ ...benchmark, name: 'ssrLoad' })
    : SSRLoadRouterLinksBenchmark.parse({
        ...benchmark,
        name: 'ssrLoadRouterLinks',
      })
}
