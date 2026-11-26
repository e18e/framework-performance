import { join } from 'node:path'
import {
  frameworksConfig,
  type FrameworkConfig,
} from '@framework-performance/results/frameworks-config'
import type { FrameworkProject } from '@framework-performance/results/benchmark-types'
import { packagesDir } from './paths.ts'
import { readJsonFile } from './files.ts'

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

  const framework = frameworksConfig.find(({ name }) => name === frameworkName)
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
