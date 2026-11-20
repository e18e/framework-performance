import {
  measurementsConfig,
  type MeasurementName,
} from '@framework-performance/results/measurements-config'

// Cloudflare Workers Builds deploys the production site from main
const isProductionBuild = process.env.WORKERS_CI_BRANCH === 'main'

/** In-review tests show in local builds and deploy previews, not production */
export function isMeasurementShown(name: MeasurementName) {
  return !isProductionBuild || measurementsConfig[name].status === 'live'
}
