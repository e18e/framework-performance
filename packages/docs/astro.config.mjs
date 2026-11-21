// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import starlight from '@astrojs/starlight'

// https://astro.build/config
export default defineConfig({
  redirects: { '/all-frameworks': '/', '/all-results': '/' },
  site: 'https://frameworks.e18e.dev',
  integrations: [
    starlight({
      title: 'Framework Performance',
      logo: { src: './src/assets/e18e.svg', alt: 'e18e' },
      description:
        'Track and compare framework performance metrics across popular meta-frameworks.',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/starlight.css'],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Inter+Tight:wght@400;500;600;700;800&display=swap',
          },
        },
      ],
      pagefind: false,
      disable404Route: true,
      sidebar: [
        { label: 'Overview', link: '/' },
        { label: 'Dev Time', link: '/dev-time/' },
        { label: 'Run Time', link: '/run-time/' },
        { label: 'Core Web Vitals', link: '/core-web-vitals/' },
        {
          label: 'Frameworks',
          collapsed: true,
          items: [{ autogenerate: { directory: 'framework' } }],
        },
        { label: 'Methodology', link: '/methodology/' },
        { label: 'Glossary', link: '/glossary/' },
        { label: 'Impact', link: '/impact/' },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/e18e/framework-performance',
        },
      ],
    }),
    mdx(),
  ],
})
