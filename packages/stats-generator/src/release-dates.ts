async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} responded with ${response.status}`)
  }
  return (await response.json()) as T
}

export async function getPublishTimes(
  frameworkPackage: string,
): Promise<Record<string, string>> {
  if (frameworkPackage === 'node') {
    const releases = await fetchJson<Array<{ version: string; date: string }>>(
      'https://nodejs.org/dist/index.json',
    )
    return Object.fromEntries(
      releases.map((release) => [
        release.version.replace(/^v/, ''),
        new Date(release.date).toISOString(),
      ]),
    )
  }

  const metadata = await fetchJson<{ time: Record<string, string> }>(
    `https://registry.npmjs.org/${frameworkPackage.replace('/', '%2F')}`,
  )
  return metadata.time
}
