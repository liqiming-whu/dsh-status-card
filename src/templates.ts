export interface GenuiSpec {
  title?: string
  gap?: number
  items: unknown[]
}

export const TEMPLATE_IDS = ['bootstrap', 'a', 'b', 'c'] as const
export type TemplateId = typeof TEMPLATE_IDS[number]

export interface TemplateOption {
  id: TemplateId
  label: string
  description: string
}

export const BOOTSTRAP_TEMPLATE_ID: TemplateId = 'bootstrap'

export const TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  { id: 'bootstrap', label: '基础状态', description: '简短的通用状态提示' },
  { id: 'a', label: 'A · 软萌活力', description: '可爱、活泼' },
  { id: 'b', label: 'B · 极简专注', description: '简洁、低干扰' },
  { id: 'c', label: 'C · 专业工作', description: '稳重、通用' },
]

export function createBootstrapSpec(cardTitle: string): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [
      {
        type: 'row', gap: 8, items: [
          { type: 'badge', label: '就绪', tone: 'success', icon: '✅' },
          { type: 'badge', label: '处理中', tone: 'accent', icon: '🧠' },
          { type: 'badge', label: '能量充足', tone: 'warn', icon: '⚡' },
        ],
      },
      { type: 'progress', label: '当前任务', value: 50, valueLabel: '动态更新' },
    ],
  }
}

export function createTemplateASpec(cardTitle: string): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [{
      type: 'card', title: '🌸 AI 状态', items: [
        {
          type: 'row', gap: 8, items: [
            { type: 'stat', label: 'Mood', value: '😊 开心' },
            { type: 'stat', label: 'Status', value: '🐾 陪伴中' },
            { type: 'stat', label: 'Energy', value: '⚡ 120%' },
          ],
        },
        { type: 'badge', label: '超可爱模式', tone: 'success', icon: '🌟' },
        { type: 'progress', label: '可爱度', value: 100, valueLabel: '100%' },
        { type: 'text', size: 'muted', content: '正在给主人准备惊喜喵~', center: true },
      ],
    }],
  }
}

export function createTemplateBSpec(cardTitle: string): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [{
      type: 'card', title: '🧭 Focus', items: [
        {
          type: 'row', gap: 8, items: [
            { type: 'badge', label: 'Ready', tone: 'success', icon: '🟢' },
            { type: 'badge', label: '处理中', tone: 'accent', icon: '🎯' },
            { type: 'badge', label: '高能', tone: 'warn', icon: '⚡' },
          ],
        },
        { type: 'progress', label: '当前任务', value: 68, valueLabel: '68%' },
        { type: 'text', size: 'muted', content: '正在专注处理你的请求。', center: true },
      ],
    }],
  }
}

export function createTemplateCSpec(cardTitle: string): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [{
      type: 'card', title: '🧠 Agent Console', items: [
        {
          type: 'row', gap: 8, items: [
            { type: 'stat', label: 'Mode', value: '🔍 分析' },
            { type: 'stat', label: 'Stage', value: '🛠️ 执行' },
            { type: 'stat', label: 'Load', value: '⚡ 82%' },
          ],
        },
        { type: 'badge', label: '状态正常', tone: 'success', icon: '✅' },
        { type: 'progress', label: '任务进度', value: 72, valueLabel: '72%' },
        { type: 'text', size: 'muted', content: '正在核对细节并生成可靠结果。', center: true },
      ],
    }],
  }
}

export function createTemplateSpec(template: TemplateId, cardTitle: string): GenuiSpec {
  switch (template) {
    case 'bootstrap': return createBootstrapSpec(cardTitle)
    case 'a': return createTemplateASpec(cardTitle)
    case 'b': return createTemplateBSpec(cardTitle)
    case 'c': return createTemplateCSpec(cardTitle)
  }
}
