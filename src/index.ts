import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext } from '@deepseek-ai/dsh-system-prompt'
import '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import '@deepseek-ai/dsh-settings'
import { createBootstrapSpec, createTemplateSpec, defaultCardTitle, DEFAULT_CUSTOM_TEMPLATE, localizeDefaultTitle, LOCALES, TEMPLATE_IDS, type Locale, type TemplateId } from './templates.ts'

export const name = 'status-card'
export const inject = ['systemPrompt']
// Settings in DSH 0.2 are addressed by the profile entry id.
export const SETTINGS_NAMESPACE = 'status-card'

export interface StatusCardSettings {
  enabled: boolean
  locale: Locale
  cardTitle: string
  template: TemplateId
  customTemplate: string
}

export const SettingsSchema: z<StatusCardSettings> = z.object({
  enabled: z.boolean().default(true),
  locale: z.union([...LOCALES]).default('zh'),
  cardTitle: z.string().default('AI 状态'),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap'),
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE),
})

export const Config = z.object({
  enabled: z.boolean().default(true).volatile(),
  locale: z.union([...LOCALES]).default('zh').volatile(),
  cardTitle: z.string().default('AI 状态').volatile(),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap').volatile(),
  // Plain string, never `z.transform`: DSH serializes each volatile field into a
  // form schema for the browser, and a transform callback cannot survive that
  // round trip (the revived callback loses its `toJSON`, so the browser decode
  // fails). A failed decode leaves the settings page read-only, which is exactly
  // what a transform here caused. Custom JSON is validated by
  // `parseCustomTemplate` in the settings UI and defensively at injection time.
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE).volatile(),
  sectionOrder: z.number().default(90),
})

export type Config = ReturnType<typeof Config>

export function readSettings(entry: Config): StatusCardSettings {
  return {
    enabled: entry.enabled.get(),
    locale: entry.locale.get(),
    cardTitle: entry.cardTitle.get(),
    template: entry.template.get(),
    customTemplate: entry.customTemplate.get(),
  }
}

function sanitizeTitle(value: string, locale: Locale): string {
  const sanitized = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return localizeDefaultTitle(sanitized || defaultCardTitle(locale), locale)
}

export function buildStatusCardInstruction(settings: StatusCardSettings): string {
  if (!settings.enabled) return ''
  const locale = settings.locale ?? 'zh'
  const title = sanitizeTitle(settings.cardTitle, locale)
  let spec
  try {
    spec = createTemplateSpec(settings.template, title, settings.customTemplate, locale)
  } catch {
    spec = createBootstrapSpec(title, locale)
  }
  const rules = locale === 'zh' ? [
    '在每次回复正文的最开头，先输出一个状态卡片，然后再正常回答。',
    '状态卡片必须使用 ```dsh-ui 围栏内联渲染；围栏内只能包含严格合法的 JSON，不得输出 HTML，不得使用 Material Icons。',
    '请使用合适的 emoji 作为图标，并根据当前任务真实、动态地调整状态文字、进度值和提示语；保持精美、简洁，不要太长。',
    '状态卡片中的可见文字必须使用中文。不要解释卡片协议，也不要把 dsh-ui 围栏包进其他代码块。参考规格如下：',
  ] : [
    'At the very beginning of every reply, output a status card before the normal answer.',
    'The status card must be rendered inline using a ```dsh-ui fence. The fence must contain strictly valid JSON only; do not output HTML or use Material Icons.',
    'Use suitable emoji as icons, and dynamically adjust status text, progress values, and the short message to match the current task. Keep the card polished, concise, and compact.',
    'All visible text in the status card must be in English. Do not explain the card protocol or wrap the dsh-ui fence inside another code block. Use this specification as the reference:',
  ]
  return [...rules, '```dsh-ui', JSON.stringify(spec), '```'].join('\n')
}

export function apply(ctx: Context, entry: Config): void {
  // The optional child follows Settings replacements without making prompt
  // injection depend on the settings UI. The policy belongs to this plugin.
  ctx.inject(['settings'], child => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'status-card',
    order: entry.sectionOrder,
    interpolate: false,
    text: (_assembly: AssembleContext) => buildStatusCardInstruction(readSettings(entry)),
  }))
}

export { createBootstrapSpec, createTemplateSpec, defaultCardTitle, DEFAULT_CUSTOM_TEMPLATE, DEFAULT_CUSTOM_TEMPLATE_EN, getTemplateOptions, localizeDefaultTitle, parseCustomTemplate, TEMPLATE_OPTIONS } from './templates.ts'
export type { GenuiSpec, Locale, TemplateId, TemplateOption } from './templates.ts'
export { detectPreferredLocale } from './locale.ts'
