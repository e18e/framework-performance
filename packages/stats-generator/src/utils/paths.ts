import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const packagesDir = join(__dirname, '../../..')

export function benchmarkOutputPath(packageName: string, file: string) {
  return join(
    process.env.BENCHMARK_OUTPUT_DIR ?? packagesDir,
    packageName,
    file,
  )
}
