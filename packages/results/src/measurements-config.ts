const ssrLoad = {
  runs: 3,
  stageConnections: [1, 5, 10, 25, 50, 100, 200],
  stageDurationMs: 5_000,
  warmupDurationMs: 5_000,
  warmupAttempts: 3,
  recoveryMs: 5_000,
  path: '/server-side-rendered',
} as const

const interactionScenarioLabel = 'first-row-detail-navigation'

/** Shared defaults for every framework. Scans run once; benchmarks repeat. */
export const measurementsConfig = {
  install: { runs: 5 },
  build: { runs: 5 },
  devServer: { runs: 5 },
  dependencies: null,
  browserBaseline: null,
  nodeEngines: null,
  ssrRequestThroughput: {
    runs: 5,
    durationMs: 10_000,
    warmupDurationMs: 250,
    minimumRequests: 64,
    warmupMinimumRequests: 16,
    path: '/ssr-throughput',
  },
  ssrLoad: {
    ...ssrLoad,
    plainLinksPath: '/server-side-rendered-plain-links',
  },
  ssrRouterLinkLoad: { ...ssrLoad },
  clientSideRendered: {
    runs: 5,
    scenarioLabel: interactionScenarioLabel,
    path: '/client-side-rendered',
  },
  serverSideRendered: {
    runs: 5,
    scenarioLabel: interactionScenarioLabel,
    path: '/server-side-rendered',
  },
  initialLoad: {
    path: '/initial-load',
  },
} as const

export type MeasurementName = keyof typeof measurementsConfig
