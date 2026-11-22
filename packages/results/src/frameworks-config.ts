import type { MeasurementName } from './measurements-config.ts'

export interface TestConfig {
  package: string
  buildScript: string
  buildOutputDir: string
  browserBuildOutputDir?: string
  devServerPort?: number
  measurements: MeasurementName[]
  serveScript?: string
  fullDocumentNavigation?: boolean
  benchmarkName?: string
}

export interface FrameworkConfig {
  name: string
  displayName: string
  frameworkPackage: string
  starter?: TestConfig
  app?: TestConfig
}

export const frameworksConfig = [
  {
    name: 'baseline-html',
    displayName: 'Baseline HTML',
    frameworkPackage: 'node',
    app: {
      package: 'app-baseline-html',
      serveScript: 'baseline-html.ts',
      buildScript: 'build',
      buildOutputDir: '.',
      measurements: ['ssrThroughput', 'ssrLoad'],
    },
  },
  {
    name: 'astro',
    displayName: 'Astro',
    frameworkPackage: 'astro',
    starter: {
      package: 'starter-astro',
      buildScript: 'build',
      buildOutputDir: 'dist',
      devServerPort: 4321,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-astro',
      serveScript: 'astro.ts',
      fullDocumentNavigation: true,
      buildScript: 'build',
      buildOutputDir: 'dist',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
      ],
    },
  },
  {
    name: 'next',
    displayName: 'Next.js',
    frameworkPackage: 'next',
    starter: {
      package: 'starter-next-js',
      buildScript: 'build',
      buildOutputDir: '.next',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-next-js',
      serveScript: 'next.ts',
      buildScript: 'build',
      buildOutputDir: '.next',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
  {
    name: 'nuxt',
    displayName: 'Nuxt',
    frameworkPackage: 'nuxt',
    starter: {
      package: 'starter-nuxt',
      buildScript: 'build',
      buildOutputDir: '.output',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-nuxt',
      serveScript: 'nitro.ts',
      buildScript: 'build',
      buildOutputDir: '.output',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
  {
    name: 'pracht',
    displayName: 'Pracht',
    frameworkPackage: '@pracht/core',
    starter: {
      package: 'starter-pracht',
      buildScript: 'build',
      buildOutputDir: 'dist',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-pracht',
      serveScript: 'pracht.ts',
      buildScript: 'build',
      buildOutputDir: 'dist',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
  {
    name: 'react-router',
    displayName: 'React Router',
    frameworkPackage: '@react-router/dev',
    starter: {
      package: 'starter-react-router',
      buildScript: 'build',
      buildOutputDir: 'build',
      devServerPort: 5173,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-react-router',
      serveScript: 'react-router.ts',
      buildScript: 'build',
      buildOutputDir: 'build',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
  {
    name: 'solid-start',
    displayName: 'SolidStart',
    frameworkPackage: '@solidjs/start',
    starter: {
      package: 'starter-solid-start',
      buildScript: 'build',
      buildOutputDir: '.output',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-solid-start',
      serveScript: 'nitro.ts',
      buildScript: 'build',
      buildOutputDir: '.output',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
      ],
    },
  },
  {
    name: 'solid',
    displayName: 'Solid 2.0',
    frameworkPackage: 'solid-js',
    starter: {
      package: 'starter-solid',
      buildScript: 'build',
      buildOutputDir: 'dist',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-solid',
      serveScript: 'solid.ts',
      buildScript: 'build',
      buildOutputDir: 'dist',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
      ],
    },
  },
  {
    name: 'sveltekit',
    displayName: 'SvelteKit',
    frameworkPackage: '@sveltejs/kit',
    starter: {
      package: 'starter-sveltekit',
      buildScript: 'build',
      buildOutputDir: 'build',
      devServerPort: 5173,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-sveltekit',
      serveScript: 'sveltekit.ts',
      buildScript: 'build',
      buildOutputDir: 'build',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
      ],
    },
  },
  {
    name: 'tanstack',
    displayName: 'TanStack Start',
    frameworkPackage: '@tanstack/react-start',
    starter: {
      package: 'starter-tanstack-start-react',
      buildScript: 'build',
      buildOutputDir: '.output',
      devServerPort: 3000,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-tanstack-start-react',
      serveScript: 'tanstack-start.ts',
      benchmarkName: 'tanstack-start',
      buildScript: 'build',
      buildOutputDir: '.output',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
  {
    name: 'void',
    displayName: 'Void',
    frameworkPackage: 'void',
    starter: {
      package: 'starter-void',
      buildScript: 'build',
      buildOutputDir: '.cloudflare/output/v1',
      browserBuildOutputDir: '.cloudflare/output/v1/workers/default/assets',
      devServerPort: 5173,
      measurements: [
        'install',
        'build',
        'devServer',
        'dependencies',
        'browserBaseline',
      ],
    },
    app: {
      package: 'app-void',
      serveScript: 'void.ts',
      buildScript: 'build',
      buildOutputDir: 'dist',
      measurements: [
        'ssrThroughput',
        'csrLighthouse',
        'ssrLighthouse',
        'ssrInitialLoad',
        'ssrLoad',
        'ssrLoadRouterLinks',
      ],
    },
  },
] satisfies FrameworkConfig[]
