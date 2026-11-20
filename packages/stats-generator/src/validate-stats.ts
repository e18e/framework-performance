import { z } from 'zod'
import { benchmarkArtifacts } from './benchmark-artifacts.ts'
import { getFrameworks } from './get-frameworks.ts'
import { benchmarkOutputPath } from './utils.ts'
import { readFileSync } from 'node:fs'

async function main() {
  const [target = 'all', filter] = process.argv.slice(2)
  let failures = 0
  for (const framework of await getFrameworks()) {
    for (const project of [framework.starter, framework.app]) {
      if (
        !project ||
        !['all', framework.name, project.package].includes(target)
      )
        continue
      for (const [measurement, , file, schema] of benchmarkArtifacts) {
        if (
          (filter && filter !== measurement) ||
          !project.measurements.includes(measurement)
        )
          continue
        const path = benchmarkOutputPath(project.package, file)
        try {
          schema.parse(JSON.parse(readFileSync(path, 'utf8')))
        } catch (error) {
          failures++
          console.error(
            path,
            error instanceof z.ZodError ? error.issues : error,
          )
        }
      }
    }
  }
  if (failures) process.exitCode = 1
  else console.info('All selected benchmark artifacts are valid.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
