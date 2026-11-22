import { measurementsConfig } from '../measurements.ts'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packagesDir } from '../constants.ts'
import { getFrameworks } from '../get-frameworks.ts'
import { getHost } from '../serve/common.ts'
import { runBenchmark } from './run-benchmark.ts'
import type { ClientSideRenderedBenchmarkResult } from './types.ts'

const CLIENT_SIDE_RENDERED_HOST = getHost()
const CLIENT_SIDE_RENDERED_PORT = 3001

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status === 200) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

async function spawnServer(
  packageName: string,
  serveScript: string,
): Promise<() => void> {
  const appDir = join(packagesDir, packageName)
  const scriptPath = fileURLToPath(
    new URL(`../serve/${serveScript}`, import.meta.url),
  )

  const proc = spawn('node', [scriptPath, appDir], {
    env: {
      ...process.env,
      HOST: CLIENT_SIDE_RENDERED_HOST,
      NODE_ENV: 'production',
      PORT: String(CLIENT_SIDE_RENDERED_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  proc.stdout?.on('data', (chunk: Buffer) =>
    process.stdout.write(`[${packageName}] ${chunk}`),
  )
  proc.stderr?.on('data', (chunk: Buffer) =>
    process.stderr.write(`[${packageName}] ${chunk}`),
  )

  let exited = false
  proc.on('exit', (code) => {
    exited = true
    if (code != null && code !== 0) {
      console.error(`[${packageName}] server exited with code ${code}`)
    }
  })

  const exitPromise = new Promise<never>((_, reject) => {
    proc.on('exit', (code) => {
      if (code != null && code !== 0) {
        reject(new Error(`Server process exited with code ${code}`))
      }
    })
  })

  await Promise.race([
    waitForServer(
      `http://${CLIENT_SIDE_RENDERED_HOST}:${CLIENT_SIDE_RENDERED_PORT}${measurementsConfig.csrLighthouse.path}`,
    ),
    exitPromise,
  ])

  return () => {
    if (!exited) proc.kill('SIGTERM')
  }
}

export async function runClientSideRenderedBenchmark(
  packageName: string,
  runs: number = measurementsConfig.csrLighthouse.runs,
): Promise<ClientSideRenderedBenchmarkResult> {
  const frameworks = (await getFrameworks()).filter(({ app }) =>
    app?.measurements.includes('csrLighthouse'),
  )
  const framework = frameworks.find(({ app }) => app?.package === packageName)
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown client-side rendered package: ${packageName}. Available: ${frameworks.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${packageName}`)
  }

  const name = `${app.benchmarkName ?? framework.name}-client-side-rendered`
  const displayName = `${framework.displayName} Client Side Rendered`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await spawnServer(packageName, app.serveScript)

  try {
    console.info(`Running client-side rendered benchmark for ${displayName}...`)
    return await runBenchmark(
      `http://${CLIENT_SIDE_RENDERED_HOST}:${CLIENT_SIDE_RENDERED_PORT}`,
      name,
      displayName,
      runs,
      app.fullDocumentNavigation ?? false,
    )
  } finally {
    killServer()
  }
}
