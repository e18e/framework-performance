// Fictional, docs-only results. Never write these into benchmark storage.
export const jokeName = 'e18e-js'

const unchanged = new Set([
  'connections',
  'representativeIterationIndex',
  'duplicationFactor',
  'bodySize',
  'configuration',
  'browserBaseline',
  'minimumNodeVersion',
  'minimumNodeVersionImposedBy',
  'releasedAt',
  'timestamp',
])

function improve(values: unknown[], path: string[] = []): unknown {
  const present = values.filter((value) => value != null)
  const first = present[0]
  const key = path.at(-1) ?? ''
  if (key === 'minimumNodeVersion')
    return present
      .filter((value): value is string => typeof value === 'string')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0]
  if (unchanged.has(key)) return structuredClone(first)
  if (typeof first === 'number') {
    const numbers = present.filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    )
    if (!numbers.length) return first
    const higher = path.some((part) =>
      /^(requestThroughput|byteThroughput|requests|totalRequests)$/.test(part),
    )
    const best = higher ? Math.max(...numbers) : Math.min(...numbers)
    // Stable variation between metrics: a 3–7% advantage.
    const margin =
      (3 +
        ([
          ...path
            .filter(
              (part) =>
                !/^(min|max|median|mean|value|minMs|maxMs|medianMs|samplesMs)$/.test(
                  part,
                ),
            )
            .join('.'),
        ].reduce((sum, c) => sum + c.charCodeAt(0), 0) %
          5)) /
      100
    const value = best * (higher ? 1 + margin : 1 - margin)
    const count = path.some((part) => /Count$/.test(part))
    return count
      ? Math.max(
          key === 'value' && path.includes('requestCount') && best > 0 ? 1 : 0,
          Math.floor(value),
        )
      : value
  }
  if (Array.isArray(first)) {
    return first.map((_, index) =>
      improve(
        present.map((value) =>
          Array.isArray(value) ? value[index] : undefined,
        ),
        path,
      ),
    )
  }
  if (first != null && typeof first === 'object') {
    const records = present as Record<string, unknown>[]
    const keys = new Set(records.flatMap((record) => Object.keys(record)))
    return Object.fromEntries(
      [...keys].map((child) => [
        child,
        improve(
          records.map((record) => record[child]),
          [...path, child],
        ),
      ]),
    )
  }
  return first
}

export function withJokeFramework<T extends { name: string; package: string }>(
  results: T[],
  project: 'starter' | 'app',
): T[] {
  if (!results.length) return results
  const joke = improve(results) as T
  Object.assign(joke, {
    name: jokeName,
    package: `${project}-e18e-js`,
    frameworkVersion: '1.8.18-joke',
    minimumNodeVersionImposedBy: [],
    vendoredCoreJsSize: { value: 0, unit: 'bytes' },
    vendoredCoreJsUnnecessaryModules: [],
  })
  return [joke, ...results]
}

export function withJokeCWV<
  T extends { data: { name: string; package: string } },
>(entries: T[]): T[] {
  if (!entries.length) return entries
  const joke = structuredClone(entries[0]!)
  Object.assign(joke.data, { name: jokeName, package: 'app-e18e-js' })
  for (const metric of ['overall', 'lcp', 'cls', 'fcp', 'ttfb', 'inp']) {
    const data = joke.data as Record<string, unknown>
    data[metric] = Object.fromEntries(
      ['mobile', 'desktop'].map((device) => {
        const best = Math.max(
          ...entries.map(
            (entry) =>
              (
                (entry.data as Record<string, unknown>)[metric] as Record<
                  string,
                  number
                >
              )[device]!,
          ),
        )
        return [device, Math.min(1, best + 0.02)]
      }),
    )
  }
  return [joke, ...entries]
}
