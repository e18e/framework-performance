import type { FrameworkConfig } from '../types.ts'
import { measurementsConfig } from '../measurements.ts'

export type SSRLoadKind = 'ssrLoad' | 'ssrLoadRouterLinks'

export function getSSRLoadKind(): SSRLoadKind {
  const kind = process.env.SSR_LOAD_KIND ?? 'ssrLoad'
  if (kind !== 'ssrLoad' && kind !== 'ssrLoadRouterLinks')
    throw new Error(`Unknown SSR load kind: ${kind}`)
  return kind
}
export function getSSRLoadPath(
  framework: FrameworkConfig,
  kind: SSRLoadKind,
): string {
  const supportsRouterLinks =
    framework.measurements.includes('ssrLoadRouterLinks')
  if (kind === 'ssrLoadRouterLinks' && !supportsRouterLinks)
    throw new Error(`Router link load is not supported for ${framework.name}`)
  return kind === 'ssrLoad' && supportsRouterLinks
    ? measurementsConfig.ssrLoad.plainLinksPath
    : measurementsConfig[kind].path
}
