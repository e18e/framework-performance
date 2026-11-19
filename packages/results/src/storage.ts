import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BenchmarkResultSchema,
  type BenchmarkResult,
} from './benchmark-schemas.ts'

export const resultsRoot = fileURLToPath(new URL('../data/', import.meta.url))

export function resultPath(
  framework: string,
  version?: string,
  root = resultsRoot,
) {
  return version
    ? join(root, framework, 'versions', `${version}.json`)
    : join(root, framework, 'latest.json')
}
export function readBenchmarkResult(
  framework: string,
  version?: string,
  root = resultsRoot,
) {
  try {
    return BenchmarkResultSchema.parse(
      JSON.parse(readFileSync(resultPath(framework, version, root), 'utf8')),
    )
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return null
    throw error
  }
}

export function saveBenchmarkResult(
  result: BenchmarkResult,
  root = resultsRoot,
) {
  const data = BenchmarkResultSchema.parse(result)
  const json = JSON.stringify(data, null, 2) + '\n'
  for (const version of [data.frameworkVersion, undefined]) {
    const path = resultPath(data.framework, version, root)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, json)
  }
}
