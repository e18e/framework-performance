import {
  getSSRLoadKind,
  getSSRLoadPath,
} from '../benchmarks/ssr-load/config.ts'
import {
  DEFAULT_SSR_LOAD_PORT,
  startSSRLoadServer,
} from '../benchmarks/ssr-load/index.ts'
import { getHost, getPort } from '../app-servers/common.ts'
import {
  getBenchmarkContext,
  requireMeasurements,
} from '../utils/benchmark-context.ts'

async function main() {
  const { packageName, framework, projectConfig } = await getBenchmarkContext({
    project: 'app',
  })
  const kind = getSSRLoadKind()
  requireMeasurements(framework, [kind])

  const host = getHost('0.0.0.0')
  process.env.HOST = host
  const port = getPort(DEFAULT_SSR_LOAD_PORT)
  process.env.PORT = String(port)

  console.info(`Starting SSR load server for ${packageName}...`)
  const path = getSSRLoadPath(framework, kind)
  const stopServer = await startSSRLoadServer(projectConfig, path)
  console.info(`SSR load server is ready on http://${host}:${port}${path}`)

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      stopServer()
      resolve()
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
