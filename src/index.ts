import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext } from '@deepseek-ai/dsh-system-prompt'
import '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { createBootstrapSpec, createTemplateSpec, defaultCardTitle, DEFAULT_CUSTOM_TEMPLATE, localizeDefaultTitle, LOCALES, parseCustomTemplate, TEMPLATE_IDS, type Locale, type TemplateId } from './templates.ts'

export const name = 'status-card'
export const inject = ['systemPrompt']
export const SETTINGS_NAMESPACE = settingsNamespace('status-card')

export interface StatusCardSettings {
  enabled: boolean
  locale: Locale
  cardTitle: string
  template: TemplateId
  customTemplate: string
}

export interface Config extends StatusCardSettings {
  sectionOrder: number
}

export const SettingsSchema: z<StatusCardSettings> = z.object({
  enabled: z.boolean().default(true),
  locale: z.union([...LOCALES]).default('zh'),
  cardTitle: z.string().default('AI 状态'),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap'),
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE),
})

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  locale: z.union([...LOCALES]).default('zh'),
  cardTitle: z.string().default('AI 状态'),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap'),
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE),
  sectionOrder: z.number().default(90),
})

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
  const entrySettings: StatusCardSettings = {
    enabled: entry.enabled,
    locale: entry.locale,
    cardTitle: entry.cardTitle,
    template: entry.template,
    customTemplate: entry.customTemplate,
  }
  let source = (): StatusCardSettings => entrySettings

  installSettingsSection(ctx, SETTINGS_NAMESPACE, SettingsSchema, entrySettings, {
    setSource: current => { source = current },
    onChange: () => {},
    validate: value => {
      if (value.template === 'custom') parseCustomTemplate(value.customTemplate, sanitizeTitle(value.cardTitle, value.locale), value.locale)
    },
  })

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'status-card',
    order: entry.sectionOrder,
    text: (_assembly: AssembleContext) => buildStatusCardInstruction(source()),
  }))
}

export { createBootstrapSpec, createTemplateSpec, defaultCardTitle, DEFAULT_CUSTOM_TEMPLATE, DEFAULT_CUSTOM_TEMPLATE_EN, getTemplateOptions, localizeDefaultTitle, parseCustomTemplate, TEMPLATE_OPTIONS } from './templates.ts'
export type { GenuiSpec, Locale, TemplateId, TemplateOption } from './templates.ts'
export { detectPreferredLocale } from './locale.ts'
