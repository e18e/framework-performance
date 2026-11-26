import { join } from 'node:path'
import { packagesDir } from '../utils/paths.ts'
import { validateFirstPartyDependencyManifest } from '../benchmarks/first-party-dependencies/first-party-dependencies.ts'
import { frameworksConfig } from '@framework-performance/results/frameworks-config'
import { getPackageJsonDeps } from '../utils/package-metadata.ts'
import { readJsonFile } from '../utils/files.ts'

async function main() {
  const failures: string[] = []

  for (const framework of frameworksConfig) {
    if (!framework.starter) continue

    const packageName = framework.starter.package
    const starterPath = join(packagesDir, packageName)
    const manifestPath = join(starterPath, 'first-party-dependencies.json')

    try {
      const manifest = readJsonFile<unknown>(manifestPath)
      const packageJson = getPackageJsonDeps(packageName)
      const errors = validateFirstPartyDependencyManifest(manifest, packageJson)

      if (errors.length === 0) {
        console.info(`✓ ${packageName}`)
      } else {
        failures.push(...errors.map((error) => `${packageName}: ${error}`))
      }
    } catch (error) {
      failures.push(
        `${packageName}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  if (failures.length > 0) {
    console.error('First-party dependency manifest validation failed:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.info('All first-party dependency manifests are in sync.')
}

main().catch((error) => {
  console.error('First-party dependency manifest validation failed:', error)
  process.exit(1)
})
