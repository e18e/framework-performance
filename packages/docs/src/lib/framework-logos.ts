import { frameworksConfig } from '@framework-performance/results/frameworks-config'

export type ThemedValue = { dark: string; light?: string }
export type FrameworkLogo = ThemedValue

export type BrandVariant = 'solid' | 'segmented'

export const BRAND_VARIANTS: readonly BrandVariant[] = ['solid', 'segmented']

export interface FrameworkBrand {
  logo: FrameworkLogo
  color: ThemedValue
  variant: BrandVariant
}

export const frameworkBrands: Record<string, FrameworkBrand> = {
  'baseline-html': {
    logo: { dark: '/framework-logos/html5.svg' },
    color: { dark: 'var(--ft-muted)' },
    variant: 'segmented',
  },
  astro: {
    logo: {
      dark: '/framework-logos/astro-gradient.svg',
      light: '/framework-logos/astro-dark.svg',
    },
    color: { dark: '#A463F2' },
    variant: 'solid',
  },
  next: {
    logo: {
      dark: '/framework-logos/nextdotjs-light.svg',
      light: '/framework-logos/nextdotjs.svg',
    },
    color: { dark: '#9C6B4E' },
    variant: 'solid',
  },
  nuxt: {
    logo: { dark: '/framework-logos/nuxt.svg' },
    color: { dark: '#3CA951', light: '#36A44D' },
    variant: 'solid',
  },
  pracht: {
    logo: { dark: '/framework-logos/pracht.svg' },
    color: { dark: '#60B9A5', light: '#459F8B' },
    variant: 'solid',
  },
  'react-router': {
    logo: { dark: '/framework-logos/reactrouter.svg' },
    color: { dark: '#F985B2', light: '#DC6B98' },
    variant: 'solid',
  },
  solid: {
    logo: { dark: '/framework-logos/solid.svg' },
    color: { dark: '#4269D0' },
    variant: 'solid',
  },
  'solid-start': {
    logo: { dark: '/framework-logos/solid-start.svg' },
    color: { dark: '#88ABE4', light: '#6F91C9' },
    variant: 'solid',
  },
  sveltekit: {
    logo: { dark: '/framework-logos/svelte.svg' },
    color: { dark: '#FF725C', light: '#EF644F' },
    variant: 'solid',
  },
  tanstack: {
    logo: { dark: '/framework-logos/tanstack.svg' },
    color: { dark: '#DAA004', light: '#BA8807' },
    variant: 'solid',
  },
  void: {
    logo: { dark: '/framework-logos/void.svg' },
    color: { dark: '#D45DD8', light: '#B843BD' },
    variant: 'solid',
  },
  // Not benchmarked, but shown in the Core Web Vitals charts.
  gatsby: {
    logo: { dark: '/framework-logos/gatsby.svg' },
    color: { dark: '#DAA004', light: '#BA8807' },
    variant: 'solid',
  },
  wordpress: {
    logo: { dark: '/framework-logos/wordpress.svg' },
    color: { dark: '#4269D0' },
    variant: 'solid',
  },
}

const brandKeyByDisplayName = new Map<string, string>([
  ...frameworksConfig.map((f) => [f.displayName, f.name] as const),
  ['Nuxt.js', 'nuxt'],
  ['Gatsby', 'gatsby'],
  ['WordPress', 'wordpress'],
])

const brandKeyByPackage = new Map<string, string>(
  frameworksConfig.flatMap((f) =>
    [f.starter?.package, f.app?.package].flatMap((packageName) =>
      packageName ? [[packageName, f.name] as const] : [],
    ),
  ),
)

export function getBrandByDisplayName(name: string) {
  const key = brandKeyByDisplayName.get(name)
  return key == null ? undefined : frameworkBrands[key]
}

export function getBrandByPackage(packageName: string) {
  const key = brandKeyByPackage.get(packageName)
  return key == null ? undefined : frameworkBrands[key]
}

export function resolveThemedValue(
  value: ThemedValue,
  theme: string | undefined,
) {
  return theme === 'light' ? (value.light ?? value.dark) : value.dark
}

/** Resolves a themed colour, expanding `var(--token)` references for canvas/SVG use. */
export function resolveBrandColor(value: ThemedValue, theme?: string) {
  const color = resolveThemedValue(value, theme)
  const match = /^var\((--[\w-]+)(?:\s*,\s*(.+))?\)$/.exec(color.trim())
  if (!match) return color
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(match[1]!)
      .trim() ||
    match[2] ||
    '#697586'
  )
}
