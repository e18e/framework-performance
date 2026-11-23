import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { packagesDir } from '../../../utils/paths.ts'
import type { ServerRenderHandler } from '../types.ts'

export async function buildHandler(): Promise<ServerRenderHandler> {
  const appDir = join(packagesDir, 'app-mastro')
  const previousCwd = process.cwd()
  try {
    // The file router discovers and imports routes relative to the app root.
    // Finish that initialization before restoring the runner's directory.
    process.chdir(appDir)
    const { app } = await import(pathToFileURL(join(appDir, 'server.ts')).href)
    await app.getRoutes()
    return {
      type: 'web',
      handler: app.createHandler({ environment: 'production' }),
    }
  } finally {
    process.chdir(previousCwd)
  }
}
