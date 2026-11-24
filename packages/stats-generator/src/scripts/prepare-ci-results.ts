import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BenchmarkCIResultSchema } from '@framework-performance/results/benchmark-schemas'
import { readBenchmarkResult } from '@framework-performance/results/storage'
import { frameworksConfig } from '../frameworks.ts'
import { getPublishTimes } from '../release-dates.ts'
import { getPackageJsonDeps } from '../utils.ts'

const outputDirectory = process.argv[2]
mkdirSync(outputDirectory, { recursive: true })
const timingMeasuredAt = new Date().toISOString()

for (const framework of frameworksConfig) {
  const projects: Record<string, unknown> = {}
  let frameworkVersion: string | undefined
  for (const project of ['starter', 'app'] as const) {
    const target = framework[project]
    if (!target) continue
    const packageJson = getPackageJsonDeps(target.package)
    const version =
      framework.frameworkPackage === 'node'
        ? process.versions.node
        : (packageJson.dependencies[framework.frameworkPackage] ??
          packageJson.devDependencies[framework.frameworkPackage])
    if (!version)
      throw new Error(`Missing framework version for ${target.package}`)
    if (frameworkVersion && version !== frameworkVersion)
      throw new Error(
        `Framework versions differ between projects for ${framework.name}: ${frameworkVersion} and ${version}`,
      )
    frameworkVersion = version
    projects[project] = {
      path: `packages/${target.package}`,
      packageJson,
    }
  }
  if (!frameworkVersion)
    throw new Error(`Missing project for ${framework.name}`)
  const previous = readBenchmarkResult(framework.name)
  const frameworkReleasedAt =
    previous?.frameworkVersion === frameworkVersion
      ? previous.frameworkReleasedAt
      : (await getPublishTimes(framework.frameworkPackage))[frameworkVersion]

  const result = BenchmarkCIResultSchema.parse({
    framework: framework.name,
    frameworkVersion,
    frameworkReleasedAt,
    projects,
    timingMeasuredAt,
    runner: process.env.RUNNER_LABEL || 'local',
    browserVersion: process.env.BROWSER_VERSION,
  })
  writeFileSync(
    join(outputDirectory, `${framework.name}.json`),
    JSON.stringify(result),
  )
}
