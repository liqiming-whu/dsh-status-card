import type { Locale } from './templates.ts'

export function detectPreferredLocale(languages: readonly string[] | undefined, fallback = ''): Locale {
  const preferred = languages?.find(language => language.trim().length > 0) ?? fallback
  return /^zh(?:[-_]|$)/i.test(preferred.trim()) ? 'zh' : 'en'
}
