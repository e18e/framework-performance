export const primaryGray = 'light-dark(var(--gray-600), var(--gray-400))'
export const highlightedGray = 'light-dark(var(--gray-700), var(--gray-200))'

export const stackGrays = [
  'light-dark(var(--gray-400), var(--gray-200))',
  'light-dark(var(--gray-500), var(--gray-400))',
  'light-dark(var(--gray-600), var(--gray-500))',
  'light-dark(var(--gray-800), var(--gray-100))',
] as const

/** Shared grid, line, and point styling for line charts. */
export function lineChartGrid() {
  const stroke =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--ft-chart-grid')
      .trim() || '#d9dee7'
  return { stroke, strokeOpacity: 1 }
}

export const lineChartLineStyle = { strokeWidth: 3 }
export const lineChartPointStyle = { r: 4, strokeWidth: 3 }
export const lineChartLatestPointStyle = { ...lineChartPointStyle, r: 6 }

export const BAR_FILL_OPACITY = 0.3
export const BAR_FOCUS_FILL_OPACITY = 0.55
export const BAR_STROKE_WIDTH = 1

export function stackFillOpacity(index: number, count: number) {
  const min = 0.15
  const max = 0.75
  return count <= 1
    ? BAR_FILL_OPACITY
    : min + ((max - min) * index) / (count - 1)
}

export const stackLegendSwatch = (index: number, count: number) =>
  `color-mix(in srgb, var(--ft-muted) ${Math.round(stackFillOpacity(index, count) * 100)}%, transparent)`
