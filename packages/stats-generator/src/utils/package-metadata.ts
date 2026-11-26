import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { packagesDir } from './paths.ts'
import type { PackageJson } from '../types.ts'

export function getPackageJsonDeps(packageName: string) {
  const packageJsonPath = join(packagesDir, packageName, 'package.json')
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8'),
  ) as PackageJson

  return {
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
  }
}

function getFrameworkDependencyName(frameworkPackage: string): string {
  return frameworkPackage.startsWith('jsr:')
    ? frameworkPackage.slice('jsr:'.length)
    : frameworkPackage
}

export function getFrameworkDependencyCountsFromPackageMetadata(
  starterPackageName: string,
  frameworkPackage: string,
) {
  // pnpm exposes JSR dependencies under their package name in node_modules.
  const installedPackageName = getFrameworkDependencyName(frameworkPackage)
  const packageJsonPath = join(
    packagesDir,
    starterPackageName,
    'node_modules',
    installedPackageName,
    'package.json',
  )
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf-8'),
  ) as PackageJson
  const dependencies = packageJson.dependencies ?? {}
  const devDependencies = packageJson.devDependencies ?? {}

  return {
    productionDependencyCount: {
      value: Object.keys(dependencies).length,
      unit: 'count',
    },
    developmentDependencyCount: {
      value: Object.keys(devDependencies).length,
      unit: 'count',
    },
  }
}
