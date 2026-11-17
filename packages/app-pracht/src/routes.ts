import { defineApp, route } from '@pracht/core'

export const app = defineApp({
  routes: [
    route('/initial-load', './routes/initial-load.tsx', {
      id: 'initial-load',
      render: 'ssr',
    }),
    route('/', './routes/home.tsx', { id: 'home', render: 'ssr' }),
    route('/server-side-rendered', './routes/server-side-rendered.tsx', {
      id: 'server-side-rendered',
      render: 'ssr',
    }),
    route(
      '/server-side-rendered-plain-links',
      './routes/server-side-rendered-plain-links.tsx',
      { id: 'server-side-rendered-plain-links', render: 'ssr' },
    ),
    route(
      '/server-side-rendered/:id',
      './routes/server-side-rendered-detail.tsx',
      {
        id: 'server-side-rendered-detail',
        render: 'ssr',
      },
    ),
    route('/client-side-rendered', './routes/client-side-rendered.tsx', {
      id: 'client-side-rendered',
      render: 'spa',
    }),
    route(
      '/client-side-rendered/:id',
      './routes/client-side-rendered-detail.tsx',
      {
        id: 'client-side-rendered-detail',
        render: 'spa',
      },
    ),
    route('/ssr-img-jpeg', './routes/ssr-img-jpeg.tsx', {
      id: 'ssr-img-jpeg',
      render: 'ssr',
    }),
    route(
      '/ssr-img-jpeg-image-component',
      './routes/ssr-img-jpeg-image-component.tsx',
      { id: 'ssr-img-jpeg-image-component', render: 'ssr' },
    ),
    route('/ssr-img-webp', './routes/ssr-img-webp.tsx', {
      id: 'ssr-img-webp',
      render: 'ssr',
    }),
    route('/ssr-throughput', './routes/ssr-throughput.tsx', {
      id: 'ssr-throughput',
      render: 'ssr',
    }),
  ],
})
