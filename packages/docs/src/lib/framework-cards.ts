import { starterStats } from './prepare-chart'
import { getBrandByPackage } from './framework-logos'
import { getFrameworkSlug } from './utils'

function getFrameworkTitle(name: string, packageName: string) {
  const logo = getBrandByPackage(packageName)?.logo
  let visual: string
  if (logo == null) {
    visual = `<span class="framework-card-symbol" aria-hidden="true">◼</span>`
  } else {
    const width = logo.width == null ? '' : ` style="width:${logo.width}px"`
    const dark = `<img class="framework-card-logo${logo.light != null ? ' framework-logo--dark' : ''}" src="${logo.dark}" alt=""${width} />`
    const light =
      logo.light != null
        ? `<img class="framework-card-logo framework-logo--light" src="${logo.light}" alt=""${width} />`
        : ''
    visual = dark + light
  }
  const labelClass = logo?.wordmark ? ' class="sr-only"' : ''
  return `<span class="framework-card-title">${visual}<span${labelClass}>${name}</span></span>`
}

export const frameworkRows = starterStats.map((framework) => ({
  name: framework.name,
  slug: getFrameworkSlug(framework.package),
  title: getFrameworkTitle(framework.name, framework.package),
  version:
    framework.frameworkVersion != null &&
    framework.frameworkVersion.trim() !== '' &&
    framework.frameworkVersion.toLowerCase() !== 'unknown'
      ? framework.frameworkVersion
      : 'Unknown',
}))
