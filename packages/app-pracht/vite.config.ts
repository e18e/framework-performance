import process from 'node:process'
import { nodeAdapter } from '@pracht/adapter-node'
import { pracht } from '@pracht/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    pracht({
      adapter: nodeAdapter({ canonicalOrigin: process.env.PRACHT_ORIGIN }),
    }),
  ],
})
