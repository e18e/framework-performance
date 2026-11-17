import process from 'node:process'
import { createImageHandler } from '@pracht/image/node'

const imageHandler = createImageHandler({
  localOrigin: process.env.PRACHT_ORIGIN,
})

export const GET = imageHandler
export const HEAD = imageHandler
