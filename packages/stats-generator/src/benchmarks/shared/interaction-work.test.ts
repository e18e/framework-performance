import assert from 'node:assert/strict'
import test from 'node:test'
import { getInteractionWorkFromTrace } from './interaction-work.ts'

const PID = 1
const MAIN_TID = 10
const COMPOSITOR_TID = 11
const OTHER_PID = 2
const TIME_ORIGIN = 2_000_000

const at = (ms: number) => TIME_ORIGIN + ms * 1000

function metadata() {
  return [
    threadName(PID, MAIN_TID, 'CrRendererMain'),
    threadName(PID, COMPOSITOR_TID, 'Compositor'),
    threadName(OTHER_PID, MAIN_TID, 'CrRendererMain'),
  ]
}

function threadName(pid: number, tid: number, name: string) {
  return { name: 'thread_name', ph: 'M', pid, tid, ts: 0, args: { name } }
}

function eventTiming(data: {
  interactionId?: number
  timeStamp: number
  duration: number
  processingStart: number
  processingEnd: number
  commitFinishTime?: number
}) {
  return {
    name: 'EventTiming',
    ph: 'b',
    pid: PID,
    tid: MAIN_TID,
    ts: at(data.timeStamp),
    args: { data: { interactionId: 7, ...data } },
  }
}

function task(
  start: number,
  end: number,
  { name = 'RunTask', pid = PID, tid = MAIN_TID } = {},
) {
  return { name, ph: 'X', pid, tid, ts: at(start), dur: (end - start) * 1000 }
}

function click({
  commitFinishTime = 1006 as number | null,
  tasks = [] as ReturnType<typeof task>[],
} = {}) {
  return {
    traceEvents: [
      ...metadata(),
      eventTiming({
        timeStamp: 1000,
        duration: 16,
        processingStart: 1000.5,
        processingEnd: 1001,
      }),
      eventTiming({
        timeStamp: 1000.2,
        duration: 15.8,
        processingStart: 1001.2,
        processingEnd: 1003,
        ...(commitFinishTime === null ? {} : { commitFinishTime }),
      }),
      task(999.8, 1003.2),
      task(1003.5, 1005, { tid: COMPOSITOR_TID }),
      task(1003.5, 1005, { pid: OTHER_PID }),
      ...tasks,
      task(1008, 1010),
    ],
  }
}

test('excludes idle time before the frame and work after commit', () => {
  assert.deepEqual(
    getInteractionWorkFromTrace(click({ tasks: [task(1004.5, 1006.5)] })),
    {
      workToCommit: 4.7,
      inputDelay: 0.5,
      processingDuration: 2.5,
      renderingWork: 1.7,
    },
  )
})

test('counts all main-thread time up to commit when there is no idle time', () => {
  assert.deepEqual(
    getInteractionWorkFromTrace(
      click({ tasks: [task(1003.2, 1005), task(1005, 1006.5)] }),
    ),
    {
      workToCommit: 6,
      inputDelay: 0.5,
      processingDuration: 2.5,
      renderingWork: 3,
    },
  )
})

test('counts overlapping tasks once', () => {
  assert.equal(
    getInteractionWorkFromTrace(
      click({
        tasks: [task(1005.2, 1006.2), task(1003.5, 1005.5), task(1004, 1005)],
      }),
    )?.renderingWork,
    2.7,
  )
})

test('returns null without commitFinishTime', () => {
  assert.equal(
    getInteractionWorkFromTrace(
      click({
        commitFinishTime: null,
        tasks: [task(1004.5, 1006.5), task(1005.5, 1005.8, { name: 'Commit' })],
      }),
    ),
    null,
  )
})

test('returns null when commitFinishTime does not follow processing', () => {
  assert.equal(
    getInteractionWorkFromTrace(
      click({ commitFinishTime: 1002, tasks: [task(1004.5, 1006.5)] }),
    ),
    null,
  )
  assert.equal(
    getInteractionWorkFromTrace({
      traceEvents: [
        ...metadata(),
        eventTiming({
          timeStamp: 1000,
          duration: 16,
          processingStart: 1000.5,
          processingEnd: 1001,
          commitFinishTime: 1002,
        }),
        eventTiming({
          timeStamp: 1000.2,
          duration: 15.8,
          processingStart: 1001.2,
          processingEnd: 1003,
        }),
        task(999.8, 1006.5),
      ],
    }),
    null,
  )
})

test('caps the commit boundary at the end of the Event Timing duration', () => {
  assert.equal(
    getInteractionWorkFromTrace(
      click({ commitFinishTime: 1030, tasks: [task(1004, 1020)] }),
    )?.renderingWork,
    12.2,
  )
})

test('scores an interaction that ends with processing without commit data', () => {
  assert.deepEqual(
    getInteractionWorkFromTrace({
      traceEvents: [
        ...metadata(),
        eventTiming({
          timeStamp: 1000.287,
          duration: 0.754,
          processingStart: 1000.791,
          processingEnd: 1001.041,
        }),
        task(999.8, 1003.2),
      ],
    }),
    {
      workToCommit: 0.754,
      inputDelay: 0.504,
      processingDuration: 0.25,
      renderingWork: 0,
    },
  )
})

test('returns null without an interaction or a renderer main thread', () => {
  assert.equal(getInteractionWorkFromTrace(undefined), null)
  assert.equal(getInteractionWorkFromTrace({ traceEvents: [] }), null)
  assert.equal(
    getInteractionWorkFromTrace({
      traceEvents: [
        ...metadata(),
        eventTiming({
          interactionId: 0,
          timeStamp: 1000,
          duration: 16,
          processingStart: 1000.5,
          processingEnd: 1003,
          commitFinishTime: 1006,
        }),
        task(999.8, 1003.2),
      ],
    }),
    null,
  )
  assert.equal(
    getInteractionWorkFromTrace({
      traceEvents: click().traceEvents.filter(
        (event) => event.name !== 'thread_name',
      ),
    }),
    null,
  )
  assert.equal(
    getInteractionWorkFromTrace({
      traceEvents: [
        ...metadata(),
        eventTiming({
          timeStamp: 1000,
          duration: 0,
          processingStart: 1000,
          processingEnd: 1000,
        }),
        task(999.8, 1003.2),
      ],
    }),
    null,
  )
})

test('scores the interaction with the longest Event Timing duration', () => {
  const trace = click({ tasks: [task(1004.5, 1006.5)] })
  trace.traceEvents.unshift(
    eventTiming({
      interactionId: 3,
      timeStamp: 900,
      duration: 8,
      processingStart: 901,
      processingEnd: 905,
      commitFinishTime: 906,
    }),
  )
  trace.traceEvents.push(
    eventTiming({
      interactionId: 9,
      timeStamp: 1100,
      duration: 4,
      processingStart: 1101,
      processingEnd: 1102,
      commitFinishTime: 1103,
    }),
  )
  assert.equal(getInteractionWorkFromTrace(trace)?.workToCommit, 4.7)
})
