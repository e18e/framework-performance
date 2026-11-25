import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packagesDir } from '../constants.ts'
import { frameworksConfig } from '../frameworks.ts'
import type { FrameworkConfig } from '../types.ts'
import { getHost, getPort } from '../serve/common.ts'
import { runLoadTest } from './run-load-test.ts'
import type { SSRLoadBenchmarkResult } from './types.ts'

import { getSSRLoadKind, getSSRLoadPath } from './config.ts'
import { verifySSRLoadTable } from './verify-table.ts'

export const DEFAULT_SSR_LOAD_PORT = 3003

const frameworks: FrameworkConfig[] = frameworksConfig

export function supportsSSRLoadBenchmark(packageName: string): boolean {
  return frameworks.some(
    ({ app, measurements }) =>
      app?.package === packageName && measurements.includes('ssrLoad'),
  )
}

function requireFrameworkConfig(packageName: string) {
  const eligible = frameworks.filter(({ measurements }) =>
    measurements.includes('ssrLoad'),
  )
  const framework = eligible.find(({ app }) => app?.package === packageName)
  const app = framework?.app

  if (!framework || !app) {
    throw new Error(
      `Unknown SSR load package: ${packageName}. Available: ${eligible.map(({ app }) => app?.package).join(', ')}`,
    )
  }
  return { framework, app }
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })
      const body = await res.text()
      if (res.status === 200 && body.includes('<table')) return
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

export async function startSSRLoadServer(
  packageName: string,
): Promise<() => void> {
  const { app } = requireFrameworkConfig(packageName)
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${packageName}`)
  }
  const path = getSSRLoadPath(packageName, getSSRLoadKind())
  return spawnServer(packageName, app.serveScript, path)
}

async function spawnServer(
  packageName: string,
  serveScript: string,
  path: string,
): Promise<() => void> {
  const host = getHost()
  const port = getPort(DEFAULT_SSR_LOAD_PORT)
  const appDir = join(packagesDir, packageName)
  const scriptPath = fileURLToPath(
    new URL(`../serve/${serveScript}`, import.meta.url),
  )

  const proc = spawn('node', [scriptPath, appDir], {
    env: {
      ...process.env,
      HOST: host,
      NODE_ENV: 'production',
      PORT: String(port),
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
    waitForServer(`http://${host}:${port}${path}`),
    exitPromise,
  ])

  return () => {
    if (!exited) proc.kill('SIGTERM')
  }
}

export async function runSSRLoadBenchmark(
  packageName: string,
): Promise<SSRLoadBenchmarkResult> {
  const { framework, app } = requireFrameworkConfig(packageName)
  const name = `${app.benchmarkName ?? framework.name}-ssr-load`
  const displayName = `${framework.displayName} SSR Load`

  const measuredPath = getSSRLoadPath(packageName, getSSRLoadKind())
  const remoteUrl = process.env.SSR_LOAD_TARGET_URL
  if (remoteUrl) {
    const url = new URL(remoteUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('SSR_LOAD_TARGET_URL must use http or https')
    }

    url.pathname = measuredPath
    console.info(`Using remote server for ${displayName}: ${url}`)
    await waitForServer(url.toString())
    verifySSRLoadTable(await (await fetch(url)).text())
    return {
      name,
      displayName,
      package: packageName,
      tests: await runLoadTest(url.toString()),
    }
  }

  const host = getHost()
  const port = getPort(DEFAULT_SSR_LOAD_PORT)
  const url = `http://${host}:${port}${measuredPath}`
  console.info(`Starting server for ${displayName}...`)
  const killServer = await startSSRLoadServer(packageName)

  try {
    verifySSRLoadTable(await (await fetch(url)).text())
    console.info(`Running SSR load benchmark for ${displayName}...`)
    return {
      name,
      displayName,
      package: packageName,
      tests: await runLoadTest(url),
    }
  } finally {
    killServer()
  }
}
