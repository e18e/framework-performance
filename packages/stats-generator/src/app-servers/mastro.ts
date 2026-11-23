import { join } from 'node:path'
import {
  getHost,
  getPort,
  parseAppDir,
  spawnProductionServer,
} from './common.ts'

const appDir = parseAppDir()
spawnProductionServer([join(appDir, 'server.ts')], appDir, {
  HOST: getHost(),
  PORT: String(getPort(8000)),
})
