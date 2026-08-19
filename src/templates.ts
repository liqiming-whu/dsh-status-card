export interface GenuiSpec {
  title?: string
  gap?: number
  items: unknown[]
}

export type TemplateId = 'bootstrap'

export interface TemplateOption {
  id: TemplateId
  label: string
  description: string
}

export const BOOTSTRAP_TEMPLATE_ID: TemplateId = 'bootstrap'

export const TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  { id: BOOTSTRAP_TEMPLATE_ID, label: '基础状态', description: '简短的通用状态提示' },
]

export function createBootstrapSpec(cardTitle: string): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [
      {
        type: 'row',
        gap: 8,
        items: [
          { type: 'badge', label: '就绪', tone: 'success', icon: '✅' },
          { type: 'badge', label: '处理中', tone: 'accent', icon: '🧠' },
          { type: 'badge', label: '能量充足', tone: 'warn', icon: '⚡' },
        ],
      },
      { type: 'progress', label: '当前任务', value: 50, valueLabel: '动态更新' },
    ],
  }
}

export function createTemplateSpec(template: TemplateId, cardTitle: string): GenuiSpec {
  switch (template) {
    case BOOTSTRAP_TEMPLATE_ID:
      return createBootstrapSpec(cardTitle)
  }
}
