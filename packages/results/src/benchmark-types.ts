export const FrameworkOptions = [
  'baseline-html',
  'astro',
  'next',
  'nuxt',
  'pracht',
  'react-router',
  'solid-start',
  'solid',
  'sveltekit',
  'tanstack',
  'void',
] as const
export type Framework = (typeof FrameworkOptions)[number]

export const PackagePathOptions = [
  'packages/app-baseline-html',
  'packages/starter-astro',
  'packages/app-astro',
  'packages/starter-next-js',
  'packages/app-next-js',
  'packages/starter-nuxt',
  'packages/app-nuxt',
  'packages/starter-pracht',
  'packages/app-pracht',
  'packages/starter-react-router',
  'packages/app-react-router',
  'packages/starter-solid-start',
  'packages/app-solid-start',
  'packages/starter-solid',
  'packages/app-solid',
  'packages/starter-sveltekit',
  'packages/app-sveltekit',
  'packages/starter-tanstack-start-react',
  'packages/app-tanstack-start-react',
  'packages/starter-void',
  'packages/app-void',
] as const
export type PackagePath = (typeof PackagePathOptions)[number]

export const FrameworkProjectOptions = ['starter', 'app'] as const
export type FrameworkProject = (typeof FrameworkProjectOptions)[number]

export const BenchmarkUnitOptions = [
  'ms',
  'ops/s',
  'requests',
  'errors',
  'requests/s',
  'bytes/s',
  'bytes',
  'KiB',
  'count',
  'ratio',
] as const
export type BenchmarkUnit = (typeof BenchmarkUnitOptions)[number]

/** @see https://developer.chrome.com/docs/lighthouse/performance/resource-summary */
export const InitialLoadResourceOptions = [
  'total',
  'document',
  'script',
  'stylesheet',
  'image',
  'media',
  'font',
  'other',
  'third-party',
] as const
export type InitialLoadResource = (typeof InitialLoadResourceOptions)[number]
