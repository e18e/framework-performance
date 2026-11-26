import type { FrameworkConfig, TestConfig } from '../types.ts'
import { startBenchmarkServer } from '../benchmark-server.ts'
import { getHost } from '../serve/common.ts'
import puppeteer from 'puppeteer-core'

import { findChromium } from '../find-chromium.ts'
import { parseResourceSummary } from './parse-resource-summary.ts'
import { startFlow } from 'lighthouse'

const INITIAL_LOAD_HOST = getHost()
const INITIAL_LOAD_PORT = 3003

async function measureInitialLoad(url: string) {
  const browser = await puppeteer.launch({
    executablePath: findChromium(),
    headless: true,
    defaultViewport: { width: 800, height: 600, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    const flow = await startFlow(page, {
      name: 'Initial load',
      flags: {
        throttlingMethod: 'provided',
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        onlyAudits: ['resource-summary'],
      },
    })
    await flow.navigate(url)
    const result = await flow.createFlowResult()
    const lhr = result.steps[0]?.lhr
    if (!lhr || lhr.runtimeError) {
      throw new Error(
        `Initial load failed: ${lhr?.runtimeError?.message ?? 'Missing Lighthouse result'}`,
      )
    }
    return parseResourceSummary(lhr.audits['resource-summary']?.details)
  } finally {
    await browser.close()
  }
}

export async function runInitialLoadBenchmark(
  framework: FrameworkConfig,
  app: TestConfig,
  path: string,
) {
  if (!app.serveScript) {
    throw new Error(`Serve script is not configured for ${app.package}`)
  }

  console.info(`Starting server for ${framework.displayName}...`)
  const killServer = await startBenchmarkServer(
    { package: app.package, serveScript: app.serveScript },
    {
      host: INITIAL_LOAD_HOST,
      port: INITIAL_LOAD_PORT,
      readinessPath: path,
    },
  )

  console.info(`Running initial load benchmark for ${framework.displayName}...`)
  const url = `http://${INITIAL_LOAD_HOST}:${INITIAL_LOAD_PORT}${path}`
  return measureInitialLoad(url).finally(killServer)
}


