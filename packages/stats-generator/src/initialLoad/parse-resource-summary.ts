import { z } from 'zod'
import {
  InitialLoadResourceType,
  SSRInitialLoadBenchmark,
} from '@framework-performance/results/benchmark-schemas'

const ResourceRowsSchema = z.array(
  z.object({
    requestCount: z.number().int().nonnegative(),
    transferSize: z.number().int().nonnegative(),
    resourceType: InitialLoadResourceType,
  }),
)

export function parseResourceSummary(details: unknown) {
  const table = z
    .object({ type: z.literal('table'), items: ResourceRowsSchema })
    .parse(details)
  const resources = Object.fromEntries(
    table.items.map(({ resourceType, requestCount, transferSize }) => [
      resourceType,
      {
        requestCount: { value: requestCount, unit: 'requests' },
        transferSize: { value: transferSize, unit: 'bytes' },
      },
    ]),
  )
  if (
    new Set(table.items.map((row) => row.resourceType)).size !==
    table.items.length
  ) {
    throw new Error('Duplicate Lighthouse resource-summary category')
  }
  // Do not include third-party when calculating totals.
  // https://developer.chrome.com/docs/lighthouse/performance/resource-summary
  return SSRInitialLoadBenchmark.parse({
    name: 'ssrInitialLoad',
    project: 'app',
    resources,
  })
}
