import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { FrameworkConfig, PackageJson } from '../../types.ts'
import { packagesDir } from '../../utils/paths.ts'

function countCompiledDependencies(frameworkName: string): number {
  switch (frameworkName) {
    case 'baseline-html':
      return 0
    case 'astro':
      return 0
    case 'next':
      return 0
    case 'nuxt':
      return 0
    case 'pracht':
      return 0
    case 'react-router':
      return 0
    case 'solid-start':
      return 0
    case 'solid':
      return 0
    case 'sveltekit':
      return 0
    case 'tanstack':
      return 0
    case 'void':
      return 0
    default:
      return 0
  }
}

export function runFrameworkDependencies(
  starterPackageName: string,
  { frameworkPackage, name }: FrameworkConfig,
) {
  const frameworkDir = join(
    packagesDir,
    starterPackageName,
    'node_modules',
    frameworkPackage,
  )
  const packageJson = JSON.parse(
    readFileSync(join(frameworkDir, 'package.json'), 'utf-8'),
  ) as PackageJson

  return {
    coreCompiled: {
      value: countCompiledDependencies(name),
      unit: 'count',
    },
    coreDev: {
      value: Object.keys(packageJson.devDependencies ?? {}).length,
      unit: 'count',
    },
    coreProd: {
      value: Object.keys(packageJson.dependencies ?? {}).length,
      unit: 'count',
    },
  }
}
