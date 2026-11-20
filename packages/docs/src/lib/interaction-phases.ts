import { stackGrays } from './chart-styles.ts'
import type { InteractionPhaseKey, InteractionWorkPartKey } from './types'

interface InteractionPart<K extends string> {
  key: K
  label: string
  description: string
  color: string
}

const inputDelay = {
  key: 'inputDelay',
  label: 'Input delay',
  description:
    'which starts when the user initiates an interaction with the page, and ends when the event callbacks for the interaction begin to run.',
  color: stackGrays[0],
} as const

const processingDuration = {
  key: 'processingDuration',
  label: 'Processing duration',
  description:
    'which consists of the time it takes for event callbacks to run to completion.',
  color: stackGrays[1],
} as const

/** Lighthouse INP phases in the order they occur, which is also the stack order bottom to top. */
export const INTERACTION_PHASES: readonly InteractionPart<InteractionPhaseKey>[] =
  [
    inputDelay,
    processingDuration,
    {
      key: 'presentationDelay',
      label: 'Presentation delay',
      description:
        'which is the time it takes for the browser to present the next frame which contains the visual result of the interaction.',
      color: stackGrays[2],
    },
  ]

/** Parts of interaction work to commit, in stack order bottom to top. */
export const INTERACTION_WORK_PARTS: readonly InteractionPart<InteractionWorkPartKey>[] =
  [
    inputDelay,
    processingDuration,
    {
      key: 'renderingWork',
      label: 'Rendering work',
      description:
        "which is the time the main thread is busy after the event callbacks, until the interaction's frame commits. It includes framework updates, style, layout, and paint, but not idle time waiting for the frame.",
      color: stackGrays[2],
    },
  ]

export interface InteractionMetric {
  totalKey: 'interactionLatency' | 'workToCommit'
  summary: string
  yAxisLabel: string
  parts: readonly InteractionPart<
    InteractionPhaseKey | InteractionWorkPartKey
  >[]
}

export const LIGHTHOUSE_INTERACTION: InteractionMetric = {
  totalKey: 'interactionLatency',
  summary:
    'Total latency is split into the three consecutive phases reported by Lighthouse.',
  yAxisLabel: 'Interaction latency (ms)',
  parts: INTERACTION_PHASES,
}

export const INTERACTION_WORK: InteractionMetric = {
  totalKey: 'workToCommit',
  summary:
    'Work to commit is the sum of three parts, measured from the Chrome trace of the interaction. Idle time waiting for the next frame, and work after the frame is committed, such as raster and presentation, are not included.',
  yAxisLabel: 'Work to commit (ms)',
  parts: INTERACTION_WORK_PARTS,
}
