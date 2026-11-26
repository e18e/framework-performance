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

/** `in-review` tests only show in local builds and deploy previews, not the production site. */
export type MeasurementStatus = 'live' | 'in-review'

/** Shared defaults for every framework. Scans run once; benchmarks repeat. */
export const measurementsConfig = {
  install: { status: 'live', runs: 5 },
  build: { status: 'live', runs: 5 },
  devServer: { status: 'live', runs: 5 },
  dependencies: { status: 'live' },
  browserBaseline: { status: 'live' },
  nodeEngines: { status: 'live' },
  ssrThroughput: {
    status: 'live',
    runs: 5,
    durationMs: 10_000,
    warmupDurationMs: 250,
    minimumRequests: 64,
    warmupMinimumRequests: 16,
    path: '/ssr-throughput',
  },
  ssrLoad: {
    status: 'live',
    ...ssrLoad,
    plainLinksPath: '/server-side-rendered-plain-links',
  },
  ssrLoadRouterLinks: { status: 'live', ...ssrLoad },
  csrLighthouse: {
    status: 'live',
    runs: 5,
    scenario: interactionScenarioLabel,
    path: '/client-side-rendered',
  },
  ssrLighthouse: {
    status: 'live',
    runs: 5,
    scenario: interactionScenarioLabel,
    path: '/server-side-rendered',
  },
  ssrInitialLoad: {
    status: 'live',
    path: '/initial-load',
  },
  ssrInitialLoadImages: {
    status: 'live',
    paths: {
      jpeg: 'ssr-img-jpeg',
      webp: 'ssr-img-webp',
    },
  },
    ssrInitialLoadFrameworkImages: {
    status: 'live',
    paths: {
      jpeg: 'ssr-img-jpeg-image-component',
      webp: 'ssr-img-webp-image-component',
    },
  },
} as const satisfies Record<
  string,
  { status: MeasurementStatus; [setting: string]: unknown }
>

export type MeasurementName = keyof typeof measurementsConfig
