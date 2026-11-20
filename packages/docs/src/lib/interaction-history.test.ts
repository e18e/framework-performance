import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  prepareClientSideRenderedInteractionWorkHistory,
  prepareLighthouseClientSideRenderedTestsInteractionHistory,
  prepareLighthouseServerSideRenderedTestsInteractionHistory,
  prepareServerSideRenderedInteractionWorkHistory,
} from './chart-measurements.ts'
import { formatLighthouse } from './result-content.ts'

const timings = (
  inputDelay: number,
  processingDuration: number,
  presentationDelay: number,
) => ({
  inputDelay,
  processingDuration,
  presentationDelay,
  interactionLatency: inputDelay + processingDuration + presentationDelay,
})
const metric = (value: number) => ({
  unit: 'ms' as const,
  mean: value,
  median: value,
  min: value,
  max: value,
})

test('rendered tests take interaction phases from the run with the median total', () => {
  const runs = [
    timings(1, 30, 9),
    timings(2, 10, 3),
    timings(1, 20, 9),
    timings(5, 40, 20),
    timings(3, 12, 10),
  ]
  const formatted = formatLighthouse({
    name: 'csrLighthouse',
    project: 'app',
    iterations: {
      runs: runs.length,
      iterations: runs.map((interactionTests) => ({
        firstPaint: { value: 100, unit: 'ms' },
        firstContentfulPaint: { value: 100, unit: 'ms' },
        interaction: {
          inputDelay: { value: interactionTests.inputDelay, unit: 'ms' },
          processingDuration: {
            value: interactionTests.processingDuration,
            unit: 'ms',
          },
          presentationDelay: {
            value: interactionTests.presentationDelay,
            unit: 'ms',
          },
          interactionLatency: {
            value: interactionTests.interactionLatency,
            unit: 'ms',
          },
        },
      })),
    },
    firstPaint: metric(100),
    firstContentfulPaint: metric(100),
    interaction: {
      interactionLatency: metric(30),
      inputDelay: metric(2),
      processingDuration: metric(20),
      presentationDelay: metric(9),
    },
  })

  assert.deepEqual(formatted.interactionTests, {
    ...timings(1, 20, 9),
  })
})

test('history keeps versions with complete interaction data, in input order', () => {
  const records = [
    {
      package: 'app-next',
      frameworkVersion: '14.0.0',
      clientSideRendered: { interactionTests: timings(1, 2, 3) },
    },
    { frameworkVersion: '15.0.0', clientSideRendered: {} },
    {
      frameworkVersion: '16.0.0',
      clientSideRendered: {
        interactionTests: { ...timings(1, 2, 3), inputDelay: Number.NaN },
      },
    },
    {
      frameworkVersion: '17.0.0',
      clientSideRendered: { interactionTests: timings(4, 5, 6) },
    },
  ]
  assert.deepEqual(
    prepareLighthouseClientSideRenderedTestsInteractionHistory(records),
    [
      { id: 'app-next:14.0.0', name: 'v14.0.0', ...timings(1, 2, 3) },
      { id: 'unknown:17.0.0', name: 'v17.0.0', ...timings(4, 5, 6) },
    ],
  )
})

test('server history reads the server measurements', () => {
  const [row] = prepareLighthouseServerSideRenderedTestsInteractionHistory([
    {
      frameworkVersion: '14.0.0',
      clientSideRendered: { interactionTests: timings(1, 1, 1) },
      serverSideRendered: { interactionTests: timings(7, 8, 9) },
    },
  ])
  assert.equal(row?.interactionLatency, 24)
})

test('history is empty when no version has interaction data', () => {
  assert.deepEqual(
    prepareLighthouseClientSideRenderedTestsInteractionHistory([
      { package: 'app-pracht', frameworkVersion: '1.0.0' },
    ]),
    [],
  )
})

const work = (
  inputDelay: number,
  processingDuration: number,
  renderingWork: number,
) => ({
  inputDelay,
  processingDuration,
  renderingWork,
  workToCommit: inputDelay + processingDuration + renderingWork,
})
const scalars = <T extends Record<string, number>>(values: T) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      { value, unit: 'ms' as const },
    ]),
  ) as { [K in keyof T]: { value: number; unit: 'ms' } }

function lighthouseResult(runs: ReturnType<typeof work>[] | number) {
  const count = typeof runs === 'number' ? runs : runs.length
  return {
    name: 'csrLighthouse' as const,
    project: 'app' as const,
    iterations: {
      runs: count,
      iterations: Array.from({ length: count }, (_, index) => ({
        firstPaint: { value: 100, unit: 'ms' as const },
        firstContentfulPaint: { value: 100, unit: 'ms' as const },
        interaction: scalars(timings(1, 2, 20 - index)),
        ...(typeof runs === 'number'
          ? {}
          : { interactionWork: scalars(runs[index]!) }),
      })),
    },
    firstPaint: metric(100),
    firstContentfulPaint: metric(100),
    interaction: {
      interactionLatency: metric(20),
      inputDelay: metric(1),
      processingDuration: metric(2),
      presentationDelay: metric(17),
    },
    ...(typeof runs === 'number'
      ? {}
      : {
          interactionWork: {
            workToCommit: metric(5),
            inputDelay: metric(1),
            processingDuration: metric(2),
            renderingWork: metric(2),
          },
        }),
  }
}

test('rendered tests take interaction work parts from the run with the median work to commit', () => {
  const formatted = formatLighthouse(
    lighthouseResult([
      work(1, 9, 1),
      work(1, 2, 1),
      work(1, 3, 2),
      work(2, 8, 4),
      work(1, 2, 4),
    ]),
  )

  assert.deepEqual(
    {
      workToCommit: formatted.interactionWork?.workToCommit,
      inputDelay: formatted.interactionWork?.inputDelay,
      processingDuration: formatted.interactionWork?.processingDuration,
      renderingWork: formatted.interactionWork?.renderingWork,
    },
    work(1, 2, 4),
  )
  assert.equal(formatted.interactionTests.interactionLatency, 21)
})

test('rendered tests recorded without interaction work keep the Lighthouse breakdown only', () => {
  const formatted = formatLighthouse(lighthouseResult(3))

  assert.equal(formatted.interactionWork, undefined)
  assert.equal(formatted.interactionTests.interactionLatency, 22)

  const partial = lighthouseResult([work(1, 2, 1), work(1, 2, 2)])
  delete (partial.iterations.iterations[1] as { interactionWork?: unknown })
    .interactionWork
  assert.equal(formatLighthouse(partial).interactionWork, undefined)
})

test('work to commit history skips versions without interaction work', () => {
  assert.deepEqual(
    prepareClientSideRenderedInteractionWorkHistory([
      {
        frameworkVersion: '1.0.0',
        clientSideRendered: { interactionTests: timings(1, 2, 3) },
      },
      {
        frameworkVersion: '1.5.0',
        clientSideRendered: {
          interactionTests: timings(1, 2, 3),
          interactionWork: { ...work(1, 2, 1), renderingWork: Number.NaN },
        },
      },
      {
        frameworkVersion: '2.0.0',
        clientSideRendered: {
          interactionTests: timings(1, 2, 3),
          interactionWork: work(1, 2, 1),
        },
      },
    ]),
    [{ id: 'unknown:2.0.0', name: 'v2.0.0', ...work(1, 2, 1) }],
  )
  assert.equal(
    prepareServerSideRenderedInteractionWorkHistory([
      {
        frameworkVersion: '2.0.0',
        clientSideRendered: { interactionWork: work(1, 1, 1) },
        serverSideRendered: { interactionWork: work(4, 5, 6) },
      },
    ])[0]?.workToCommit,
    15,
  )
})
