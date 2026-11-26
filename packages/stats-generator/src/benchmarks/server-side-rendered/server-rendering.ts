import {
  renderedSampleMetrics,
  measuredSSRLighthouse,
} from '../../rendered-sample-metrics.ts'
import { summarizeMetric } from '../../sample-statistics.ts'
import type { RenderedTestSample } from '../../types.ts'

export function assembleServerRendering(iterations: RenderedTestSample[]) {
  return measuredSSRLighthouse.parse({
    name: 'ssrLighthouse',
    project: 'app',
    iterations: {
      runs: iterations.length,
      iterations: iterations.map(renderedSampleMetrics),
    },
    firstPaint: summarizeMetric(iterations.map((value) => value.firstPaint)),
    firstContentfulPaint: summarizeMetric(
      iterations.map((value) => value.firstContentfulPaint),
    ),
    interaction: {
      ...Object.fromEntries(
        [
          'interactionLatency',
          'inputDelay',
          'processingDuration',
          'presentationDelay',
        ].map((key) => [
          key,
          summarizeMetric(
            iterations.map(
              (value) =>
                value.interactionTests[
                  key as keyof RenderedTestSample['interactionTests']
                ],
            ),
          ),
        ]),
      ),
    },
    interactionWork: Object.fromEntries(
      (
        [
          'workToCommit',
          'inputDelay',
          'processingDuration',
          'renderingWork',
        ] as const
      ).map((key) => [
        key,
        summarizeMetric(iterations.map((value) => value.interactionWork[key])),
      ]),
    ),
  })
}
