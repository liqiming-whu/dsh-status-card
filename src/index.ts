import type { Context } from '@deepseek-ai/cordis'
import type { AssembleContext } from '@deepseek-ai/dsh-system-prompt'
import '@deepseek-ai/dsh-system-prompt'
import z from '@deepseek-ai/schemastery'
import { createBootstrapSpec } from './templates.ts'

export const name = 'status-card'
export const inject = ['systemPrompt']

export interface Config {
  enabled: boolean
  cardTitle: string
  sectionOrder: number
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  cardTitle: z.string().default('AI 状态'),
  sectionOrder: z.number().default(90),
})

function sanitizeTitle(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'AI 状态'
}

export function buildStatusCardInstruction(config: Config): string {
  if (!config.enabled) return ''
  const spec = createBootstrapSpec(sanitizeTitle(config.cardTitle))
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

export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'status-card',
    order: config.sectionOrder,
    text: (_assembly: AssembleContext) => buildStatusCardInstruction(config),
  }))
}

export { createBootstrapSpec } from './templates.ts'
