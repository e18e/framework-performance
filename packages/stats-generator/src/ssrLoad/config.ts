import { frameworksConfig } from '../frameworks.ts'
import type { FrameworkConfig } from '../types.ts'
import { measurementsConfig } from '../measurements.ts'

export type SSRLoadKind = 'ssrLoad' | 'ssrRouterLinkLoad'

export function getSSRLoadKind(): SSRLoadKind {
  const kind = process.env.SSR_LOAD_KIND ?? 'ssrLoad'
  if (kind !== 'ssrLoad' && kind !== 'ssrRouterLinkLoad')
    throw new Error(`Unknown SSR load kind: ${kind}`)
  return kind
}
export function getSSRLoadPath(packageName: string, kind: SSRLoadKind): string {
  const frameworks: FrameworkConfig[] = frameworksConfig
  const app = frameworks.find(({ app }) => app?.package === packageName)?.app
  const supportsRouterLinks = app?.measurements.includes('ssrRouterLinkLoad')
  if (kind === 'ssrRouterLinkLoad' && !supportsRouterLinks)
    throw new Error(`Router link load is not supported for ${packageName}`)
  return kind === 'ssrLoad' && supportsRouterLinks
    ? measurementsConfig.ssrLoad.plainLinksPath
    : measurementsConfig[kind].path
}
