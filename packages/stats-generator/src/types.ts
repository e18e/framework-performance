export type {
  FrameworkConfig,
  TestConfig,
} from '@framework-performance/results/frameworks-config'

export interface InteractionTiming {
  interactionLatency: number
  inputDelay: number
  processingDuration: number
  presentationDelay: number
}

export interface RenderedTestSample {
  firstPaint: number
  firstContentfulPaint: number
  interactionTests: InteractionTiming
}

export interface TimeStat {
  avgMs: number
  standardDeviationMs: number
  minMs: number
  maxMs: number
  samplesMs: number[]
}

export interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
