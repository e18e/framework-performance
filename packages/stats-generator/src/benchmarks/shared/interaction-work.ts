export interface InteractionWork {
  /** Input delay plus processing duration plus rendering work, in ms. */
  workToCommit: number
  /** Input timestamp to the start of the first event handler, in ms. */
  inputDelay: number
  /** Start of the first event handler to the end of the last, in ms. */
  processingDuration: number
  /** Renderer main-thread busy time from the end of processing until the interaction's frame commits, in ms. */
  renderingWork: number
}

interface EventTimingData {
  interactionId?: number
  timeStamp?: number
  duration?: number
  processingStart?: number
  processingEnd?: number
  commitFinishTime?: number
}

interface TraceEvent {
  name?: string
  ph?: string
  pid?: number
  tid?: number
  ts?: number
  dur?: number
  args?: { name?: string; data?: EventTimingData }
}

type CompleteEvent = TraceEvent & { ts: number; dur: number }

/** Trace-clock timestamps in microseconds. */
interface Interaction {
  pid: number
  start: number
  end: number
  processingStart: number
  processingEnd: number
  commitFinish?: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function maxDefined(a: number | undefined, b: number | undefined) {
  return a === undefined ? b : b === undefined ? a : Math.max(a, b)
}

/**
 * Event Timing fields are milliseconds relative to the document's time origin, with microsecond precision.
 * The start event's `ts` is the trace-clock time of its `timeStamp`.
 */
function toInteraction(event: TraceEvent): Interaction | undefined {
  const data = event.args?.data
  if (
    !isFiniteNumber(event.pid) ||
    !isFiniteNumber(event.ts) ||
    !isFiniteNumber(data?.timeStamp) ||
    !isFiniteNumber(data.duration) ||
    !isFiniteNumber(data.processingStart) ||
    !isFiniteNumber(data.processingEnd)
  )
    return undefined

  const { ts } = event
  const { timeStamp } = data
  const toTraceTime = (ms: number) => Math.round(ts + (ms - timeStamp) * 1000)
  return {
    pid: event.pid,
    start: ts,
    end: toTraceTime(timeStamp + data.duration),
    processingStart: toTraceTime(data.processingStart),
    processingEnd: toTraceTime(data.processingEnd),
    commitFinish: isFiniteNumber(data.commitFinishTime)
      ? toTraceTime(data.commitFinishTime)
      : undefined,
  }
}

/** Merges the Event Timing entries of each interaction and returns the one with the longest duration. */
function findLongestInteraction(
  events: readonly TraceEvent[],
): Interaction | undefined {
  const interactions = new Map<string, Interaction>()
  for (const event of events) {
    const interactionId = event.args?.data?.interactionId
    if (event.name !== 'EventTiming' || event.ph !== 'b' || !interactionId)
      continue
    const current = toInteraction(event)
    if (!current) continue

    const key = `${current.pid}:${interactionId}`
    const existing = interactions.get(key)
    interactions.set(
      key,
      existing
        ? {
            pid: current.pid,
            start: Math.min(existing.start, current.start),
            end: Math.max(existing.end, current.end),
            processingStart: Math.min(
              existing.processingStart,
              current.processingStart,
            ),
            processingEnd: Math.max(
              existing.processingEnd,
              current.processingEnd,
            ),
            commitFinish: maxDefined(
              existing.commitFinish,
              current.commitFinish,
            ),
          }
        : current,
    )
  }

  let longest: Interaction | undefined
  for (const interaction of interactions.values()) {
    if (
      !longest ||
      interaction.end - interaction.start > longest.end - longest.start
    )
      longest = interaction
  }
  return longest
}

function getMainThreadTasks(events: readonly TraceEvent[], pid: number) {
  const threads = new Set(
    events
      .filter(
        (event) =>
          event.ph === 'M' &&
          event.name === 'thread_name' &&
          event.args?.name === 'CrRendererMain' &&
          event.pid === pid &&
          isFiniteNumber(event.tid),
      )
      .map((event) => event.tid),
  )
  if (threads.size === 0) return undefined
  return events.filter(
    (event): event is CompleteEvent =>
      event.ph === 'X' &&
      event.name === 'RunTask' &&
      event.pid === pid &&
      threads.has(event.tid) &&
      isFiniteNumber(event.ts) &&
      isFiniteNumber(event.dur),
  )
}

/** Total length of the union of the tasks' intervals, clipped to [from, to]. */
function getBusyTime(
  tasks: readonly CompleteEvent[],
  from: number,
  to: number,
): number {
  const intervals = tasks
    .map(({ ts, dur }) => [Math.max(ts, from), Math.min(ts + dur, to)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])

  let busy = 0
  let current: number[] | undefined
  for (const interval of intervals) {
    if (current && interval[0] <= current[1]) {
      current[1] = Math.max(current[1], interval[1])
      continue
    }
    if (current) busy += current[1] - current[0]
    current = interval
  }
  if (current) busy += current[1] - current[0]
  return busy
}

/**
 * Scores the longest interaction in a Chrome trace as input delay plus processing duration, plus the renderer main
 * thread's busy time from the end of processing until `commitFinishTime`, capped at the end of the Event Timing
 * duration. Returns null when the trace has no interaction or renderer main thread, or when the duration extends past
 * processing without a later `commitFinishTime`.
 */
export function getInteractionWorkFromTrace(
  trace: unknown,
): InteractionWork | null {
  const events =
    (trace as { traceEvents?: readonly TraceEvent[] } | undefined)
      ?.traceEvents ?? []
  const interaction = findLongestInteraction(events)
  if (!interaction) return null
  const tasks = getMainThreadTasks(events, interaction.pid)
  const { start, end, processingStart, processingEnd, commitFinish } =
    interaction
  const commitBoundary =
    end <= processingEnd
      ? end
      : commitFinish === undefined || commitFinish <= processingEnd
        ? undefined
        : Math.min(commitFinish, end)
  if (!tasks || commitBoundary === undefined) return null

  const inputDelay = Math.round(processingStart - start)
  const processingDuration = Math.round(processingEnd - processingStart)
  const renderingWork = Math.round(
    getBusyTime(tasks, processingEnd, commitBoundary),
  )
  const workToCommit = inputDelay + processingDuration + renderingWork
  if (inputDelay < 0 || processingDuration < 0 || workToCommit <= 0) return null

  return {
    workToCommit: workToCommit / 1000,
    inputDelay: inputDelay / 1000,
    processingDuration: processingDuration / 1000,
    renderingWork: renderingWork / 1000,
  }
}
