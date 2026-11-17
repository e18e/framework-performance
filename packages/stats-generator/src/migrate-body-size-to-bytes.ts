import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { packagesDir } from './constants.ts'

const BYTES_PER_KIB = 1024
const resultsDir = join(packagesDir, 'results', 'data')
const dryRun = process.argv.includes('--dry-run')

const pattern =
  /("bodySize"\s*:\s*\{\s*"value"\s*:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(\s*,\s*"unit"\s*:\s*)"KiB"/g

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return jsonFiles(path)
    return path.endsWith('.json') ? [path] : []
  })
}

let filesChanged = 0
let valuesConverted = 0

for (const file of jsonFiles(resultsDir)) {
  const source = readFileSync(file, 'utf8')
  let count = 0
  const migrated = source.replace(
    pattern,
    (_, before: string, kib: string, between: string) => {
      count++
      const bytes = Math.round(Number(kib) * BYTES_PER_KIB)
      return `${before}${bytes}${between}"bytes"`
    },
  )
  if (count === 0) continue

  // Guard against a malformed edit before writing anything.
  JSON.parse(migrated)
  if (migrated.includes('"KiB"')) {
    throw new Error(`Unconverted KiB value left in ${file}`)
  }

  if (!dryRun) writeFileSync(file, migrated)
  filesChanged++
  valuesConverted += count
  console.log(`${dryRun ? '[dry-run] ' : ''}${file}: ${count} value(s)`)
}

console.log(
  `${dryRun ? 'Would convert' : 'Converted'} ${valuesConverted} value(s) across ${filesChanged} file(s).`,
)
