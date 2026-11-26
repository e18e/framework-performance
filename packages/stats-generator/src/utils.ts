import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { packagesDir } from './constants.ts'
import { getFrameworks } from './get-frameworks.ts'
import type { FrameworkProject } from '@framework-performance/results/benchmark-types'
import type { FrameworkConfig, PackageJson } from './types.ts'

/** Get directory size in bytes using du on Linux and macOS. */
export function getDirectorySize(dirPath: string): number {
  try {
    const output = execFileSync('du', ['-sk', dirPath], { encoding: 'utf-8' })
    const sizeKb = Number.parseInt(output.split(/\s+/)[0], 10)
    return sizeKb * 1024
  } catch (error) {
    console.warn(`Warning: Could not get directory size for ${dirPath}:`, error)
    return 0
  }
}

/**
 * Read and parse a JSON file. Returns null if file doesn't exist or can't be parsed.
 */
export function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) {
      return null
    }
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    console.warn(`Warning: Failed to read ${filePath}:`, error)
    return null
  }
}

export function benchmarkOutputPath(packageName: string, file: string) {
  return join(
    process.env.BENCHMARK_OUTPUT_DIR ?? packagesDir,
    packageName,
    file,
  )
}

/**
 * Write data to a JSON file, creating directories if needed.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

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

function getFrameworkVersion(
  packageName: string,
  frameworkPackage: string,
): string {
  if (frameworkPackage === 'node') {
    return process.version.replace(/^v/, '')
  }

  const pkgJsonPath = join(
    packagesDir,
    packageName,
    'node_modules',
    frameworkPackage,
    'package.json',
  )
  const pkg = readJsonFile<{ version?: unknown }>(pkgJsonPath)
  if (typeof pkg?.version !== 'string' || !pkg.version)
    throw new Error(
      `Missing framework version for ${frameworkPackage} in ${packageName}`,
    )
  return pkg.version
}

export function requireMeasurements(
  framework: FrameworkConfig,
  measurements: FrameworkConfig['measurements'],
) {
  if (
    !measurements.some((measurement) =>
      framework.measurements.includes(measurement),
    )
  ) {
    throw new Error(
      `${framework.name} requires at least one configured measurement from: ${measurements.join(', ')}`,
    )
  }
}

export async function getBenchmarkContext({
  project,
}: {
  project: FrameworkProject
}) {
  const frameworkName = process.argv[2]
  if (!frameworkName)
    throw new Error('Framework name is required (e.g. astro).')

  const framework = (await getFrameworks()).find(
    ({ name }) => name === frameworkName,
  )
  if (!framework) throw new Error(`Unknown framework: ${frameworkName}`)
  const projectConfig = framework[project]
  if (!projectConfig)
    throw new Error(`No ${project} configured for ${frameworkName}`)
  return {
    packageName: projectConfig.package,
    framework,
    projectConfig,
    get frameworkVersion() {
      return getFrameworkVersion(
        projectConfig.package,
        framework.frameworkPackage,
      )
    },
  }
}
