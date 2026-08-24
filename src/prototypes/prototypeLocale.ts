export type PrototypeLocale = 'en' | 'de' | 'th' | 'he'

export function getPrototypeLocale(): PrototypeLocale {
  if (window.location.pathname.includes('-th')) return 'th'
  if (window.location.pathname.includes('-he')) return 'he'
  if (/-de(?:\/|$)/.test(window.location.pathname)) return 'de'
  return 'en'
}

export function localeQuery(): string {
  const locale = getPrototypeLocale()
  return locale === 'en' ? '' : `&lang=${locale}`
}

export function localizedPrototypeRoute(baseRoute: string): string {
  const locale = getPrototypeLocale()
  return locale === 'en' ? baseRoute : `${baseRoute}-${locale}`
}
