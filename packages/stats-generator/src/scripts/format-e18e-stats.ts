import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { DependencyCountBenchmark } from '@framework-performance/results/benchmark-schemas'
import { writeJsonFile } from '../utils/files.ts'

export const e18eStats = z
  .object({
    stats: z.object({
      dependencyCount: z.object({
        production: z.number(),
        development: z.number(),
      }),
      installSize: z.number(),
      extraStats: z
        .array(
          z.object({
            name: z.string(),
            value: z.union([z.number(), z.string()]),
          }),
        )
        .optional(),
    }),
  })
  .transform(({ stats }) => ({
    dependencyCounts: {
      starterDev: { value: stats.dependencyCount.development },
      starterProd: { value: stats.dependencyCount.production },
      starterDuplicate: {
        value: stats.extraStats?.find(
          ({ name }) => name === 'duplicateDependencyCount',
        )?.value,
      },
      starterDependencyInstallSize: { value: stats.installSize },
    },
  }))
  .pipe(
    z.object({
      dependencyCounts: DependencyCountBenchmark.pick({
        starterDev: true,
        starterProd: true,
        starterDuplicate: true,
        starterDependencyInstallSize: true,
      }),
    }),
  )

if (import.meta.main) {
  const stats = e18eStats.parse(JSON.parse(readFileSync(0, 'utf8')))
  writeJsonFile(process.argv[2], stats)
}
