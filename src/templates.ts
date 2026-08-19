export interface GenuiSpec {
  title?: string
  gap?: number
  items: unknown[]
}

export const BOOTSTRAP_TEMPLATE_ID = 'bootstrap' as const

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
