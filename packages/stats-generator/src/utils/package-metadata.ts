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
