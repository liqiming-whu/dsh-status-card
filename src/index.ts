import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext } from '@deepseek-ai/dsh-system-prompt'
import '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { createBootstrapSpec, createTemplateSpec, DEFAULT_CUSTOM_TEMPLATE, parseCustomTemplate, TEMPLATE_IDS, type TemplateId } from './templates.ts'

export const name = 'status-card'
export const inject = ['systemPrompt']
export const SETTINGS_NAMESPACE = settingsNamespace('status-card')

export interface StatusCardSettings {
  enabled: boolean
  cardTitle: string
  template: TemplateId
  customTemplate: string
}

export interface Config extends StatusCardSettings {
  sectionOrder: number
}

export const SettingsSchema: z<StatusCardSettings> = z.object({
  enabled: z.boolean().default(true),
  cardTitle: z.string().default('AI 状态'),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap'),
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE),
})

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  cardTitle: z.string().default('AI 状态'),
  template: z.union([...TEMPLATE_IDS]).default('bootstrap'),
  customTemplate: z.string().default(DEFAULT_CUSTOM_TEMPLATE),
  sectionOrder: z.number().default(90),
})

function sanitizeTitle(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'AI 状态'
}

export function buildStatusCardInstruction(settings: StatusCardSettings): string {
  if (!settings.enabled) return ''
  const title = sanitizeTitle(settings.cardTitle)
  let spec
  try {
    spec = createTemplateSpec(settings.template, title, settings.customTemplate)
  } catch {
    spec = createBootstrapSpec(title)
  }
  return [
    '在每次回复正文的最开头，先输出一个状态卡片，然后再正常回答。',
    '状态卡片必须使用 ```dsh-ui 围栏内联渲染；围栏内只能包含严格合法的 JSON，不得输出 HTML，不得使用 Material Icons。',
    '请使用合适的 emoji 作为图标，并根据当前任务真实、动态地调整状态文字、进度值和提示语；保持精美、简洁，不要太长。',
    '不要解释卡片协议，也不要把 dsh-ui 围栏包进其他代码块。参考规格如下：',
    '```dsh-ui',
    JSON.stringify(spec),
    '```',
  ].join('\n')
}

export function apply(ctx: Context, entry: Config): void {
  const entrySettings: StatusCardSettings = {
    enabled: entry.enabled,
    cardTitle: entry.cardTitle,
    template: entry.template,
    customTemplate: entry.customTemplate,
  }
  let source = (): StatusCardSettings => entrySettings

  installSettingsSection(ctx, SETTINGS_NAMESPACE, SettingsSchema, entrySettings, {
    setSource: current => { source = current },
    onChange: () => {},
    validate: value => {
      if (value.template === 'custom') parseCustomTemplate(value.customTemplate, sanitizeTitle(value.cardTitle))
    },
  })

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'status-card',
    order: entry.sectionOrder,
    text: (_assembly: AssembleContext) => buildStatusCardInstruction(source()),
  }))
}

export { createBootstrapSpec, createTemplateSpec, DEFAULT_CUSTOM_TEMPLATE, parseCustomTemplate, TEMPLATE_OPTIONS } from './templates.ts'
export type { GenuiSpec, TemplateId, TemplateOption } from './templates.ts'
