import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PackageJson } from '../../types.ts'
import { packagesDir } from '../../utils/paths.ts'

export function runFrameworkDependencies(
  starterPackageName: string,
  frameworkPackage: string,
) {
  const packageJsonPath = join(
    packagesDir,
    starterPackageName,
    'node_modules',
    frameworkPackage,
    'package.json',
  )
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8'),
  ) as PackageJson

  return {
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
