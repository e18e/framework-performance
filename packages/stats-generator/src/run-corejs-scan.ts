import { CoreJsBenchmark } from '@framework-performance/results/benchmark-schemas'
import { readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { glob } from 'tinyglobby'
import coreJsCompat from 'core-js-compat/compat.js'
import getModulesListForTargetVersion from 'core-js-compat/get-modules-list-for-target-version.js'
import { packagesDir } from './constants.ts'
import {
  benchmarkOutputPath,
  getBenchmarkContext,
  requireMeasurements,
  writeJsonFile,
} from './utils.ts'

const BROWSER_TARGETS =
  'last 2 Chrome major versions, last 2 Firefox major versions, last 2 Safari major versions, last 2 Edge major versions'

function getUnnecessaryModules(version: string): string[] {
  try {
    const allModules = getModulesListForTargetVersion(version)
    const needed = new Set(
      coreJsCompat({ targets: BROWSER_TARGETS, version }).list,
    )
    return allModules.filter((m) => !needed.has(m))
  } catch {
    return []
  }
}

function hasVendoredCoreJs(source: string): boolean {
  return (
    source.includes('Denis Pushkarev') ||
    source.includes('zloirock') ||
    source.includes('__core-js_shared__') ||
    source.includes('mode:"global"')
  )
}

function extractVersion(source: string): string {
  const match = source.match(/version:"(\d+\.\d+\.\d+)"/)
  return match ? match[1] : 'unknown'
}

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext({
    project: 'starter',
  })
  requireMeasurements(framework, ['coreJS'])

  console.info(
    `Scanning build output for vendored core-js in ${framework.displayName} (${packageName})...\n`,
  )

  const buildOutputPath = join(
    packagesDir,
    packageName,
    projectConfig.buildOutputDir,
  )
  const jsFiles = await glob('**/*.{js,mjs}', {
    cwd: buildOutputPath,
    absolute: true,
  }).catch(() => [])

  const vendoredFiles: Array<{
    file: string
    version: string
    sizeBytes: number
    unnecessaryModules: string[]
  }> = []
  let totalVendoredBytes = 0

  for (const filePath of jsFiles) {
    let source: string
    let sizeBytes: number
    try {
      source = readFileSync(filePath, 'utf-8')
      sizeBytes = statSync(filePath).size
    } catch {
      continue
    }

    if (!hasVendoredCoreJs(source)) {
      continue
    }

    const version = extractVersion(source)
    const relPath = relative(buildOutputPath, filePath)
    const unnecessaryModules =
      version !== 'unknown' ? getUnnecessaryModules(version) : []

    vendoredFiles.push({
      file: relPath,
      version,
      sizeBytes,
      unnecessaryModules,
    })
    totalVendoredBytes += sizeBytes

    const sizeKb = (sizeBytes / 1024).toFixed(1)
    console.info(
      `  Found vendored core-js ${version} in ${relPath} (${sizeKb} KB)`,
    )
    if (unnecessaryModules.length > 0) {
      console.info(
        `    ${unnecessaryModules.length} unnecessary modules for last 2 major versions`,
      )
    }
  }

  if (vendoredFiles.length === 0) {
    console.info('  No vendored core-js detected.')
  } else {
    const totalKb = (totalVendoredBytes / 1024).toFixed(1)
    console.info(
      `\nTotal vendored core-js size: ${totalKb} KB across ${vendoredFiles.length} file(s)`,
    )
  }

  const unnecessaryModules = [
    ...new Set(vendoredFiles.flatMap((f) => f.unnecessaryModules)),
  ]
  const stats = CoreJsBenchmark.parse({
    project: 'starter',
    name: 'coreJs',
    totalVendoredSize: { value: totalVendoredBytes, unit: 'bytes' },
    unnecessaryModules,
  })

  const outputPath = benchmarkOutputPath(packageName, 'corejs-stats.json')
  writeJsonFile(outputPath, { coreJS: stats })

  console.info(`\n✓ Saved core-js stats to ${outputPath}`)
}

main().catch((error) => {
  console.error('Core-js scan failed:', error)
  process.exit(1)
})
