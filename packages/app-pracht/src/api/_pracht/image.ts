import process from 'node:process'
import { createImageHandler } from '@pracht/image/node'

const imageHandler = createImageHandler({
  localOrigin:
    process.env.PRACHT_ORIGIN ??
    `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? '3000'}`,
})

export const GET = imageHandler
export const HEAD = imageHandler
