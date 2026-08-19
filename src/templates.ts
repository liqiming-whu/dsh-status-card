export interface GenuiSpec {
  title?: string
  gap?: number
  items: unknown[]
}

export const LOCALES = ['zh', 'en'] as const
export type Locale = typeof LOCALES[number]
export const TEMPLATE_IDS = ['bootstrap', 'a', 'b', 'c', 'd', 'e', 'f', 'custom'] as const
export type TemplateId = typeof TEMPLATE_IDS[number]

export interface TemplateOption {
  id: TemplateId
  label: string
  description: string
}

export const BOOTSTRAP_TEMPLATE_ID: TemplateId = 'bootstrap'

const TEMPLATE_OPTIONS_BY_LOCALE: Record<Locale, readonly TemplateOption[]> = {
  zh: [
    { id: 'bootstrap', label: '基础状态', description: '简短的通用状态提示' },
    { id: 'a', label: 'A · 软萌活力', description: '可爱、活泼' },
    { id: 'b', label: 'B · 极简专注', description: '简洁、低干扰' },
    { id: 'c', label: 'C · 专业工作', description: '稳重、通用' },
    { id: 'd', label: 'D · 星舰科技', description: '科技、未来感' },
    { id: 'e', label: 'E · 温暖陪伴', description: '温柔、治愈' },
    { id: 'f', label: 'F · 开发者终端', description: '编程、工程化' },
    { id: 'custom', label: '自定义模板', description: '编辑 JSON 并实时预览' },
  ],
  en: [
    { id: 'bootstrap', label: 'Basic Status', description: 'Short, general-purpose status' },
    { id: 'a', label: 'A · Soft Vitality', description: 'Cute and lively' },
    { id: 'b', label: 'B · Minimal Focus', description: 'Clean and unobtrusive' },
    { id: 'c', label: 'C · Professional Work', description: 'Calm and versatile' },
    { id: 'd', label: 'D · Neural Deck', description: 'Futuristic and technical' },
    { id: 'e', label: 'E · Warm Companion', description: 'Gentle and comforting' },
    { id: 'f', label: 'F · Developer Runtime', description: 'Coding and engineering' },
    { id: 'custom', label: 'Custom Template', description: 'Edit JSON with live preview' },
  ],
}

export function getTemplateOptions(locale: Locale): readonly TemplateOption[] {
  return TEMPLATE_OPTIONS_BY_LOCALE[locale]
}

export const TEMPLATE_OPTIONS = TEMPLATE_OPTIONS_BY_LOCALE.zh

export const DEFAULT_CUSTOM_TEMPLATE = JSON.stringify({
  gap: 10,
  items: [{
    type: 'card', title: '🎨 我的状态', items: [
      { type: 'badge', label: '自定义模式', tone: 'accent', icon: '✨' },
      { type: 'progress', label: '当前进度', value: 60, valueLabel: '动态更新' },
      { type: 'text', size: 'muted', content: '正在按自定义模板工作。', center: true },
    ],
  }],
})

export const DEFAULT_CUSTOM_TEMPLATE_EN = JSON.stringify({
  gap: 10,
  items: [{
    type: 'card', title: '🎨 My Status', items: [
      { type: 'badge', label: 'Custom Mode', tone: 'accent', icon: '✨' },
      { type: 'progress', label: 'Current progress', value: 60, valueLabel: 'Live' },
      { type: 'text', size: 'muted', content: 'Working with your custom template.', center: true },
    ],
  }],
})

export function defaultCardTitle(locale: Locale): string {
  return locale === 'zh' ? 'AI 状态' : 'AI Status'
}

export function localizeDefaultTitle(value: string, locale: Locale): string {
  return value === 'AI 状态' || value === 'AI Status' ? defaultCardTitle(locale) : value
}

export function createBootstrapSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle,
    gap: 10,
    items: [
      {
        type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'badge', label: '就绪', tone: 'success', icon: '✅' },
          { type: 'badge', label: '处理中', tone: 'accent', icon: '🧠' },
          { type: 'badge', label: '能量充足', tone: 'warn', icon: '⚡' },
        ] : [
          { type: 'badge', label: 'Ready', tone: 'success', icon: '✅' },
          { type: 'badge', label: 'Processing', tone: 'accent', icon: '🧠' },
          { type: 'badge', label: 'High Energy', tone: 'warn', icon: '⚡' },
        ],
      },
      { type: 'progress', label: locale === 'zh' ? '当前任务' : 'Current task', value: 50, valueLabel: locale === 'zh' ? '动态更新' : 'Live' },
    ],
  }
}

export function createTemplateASpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '🌸 AI 状态' : '🌸 AI Status', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'stat', label: '心情', value: '😊 开心' },
          { type: 'stat', label: '状态', value: '🐾 陪伴中' },
          { type: 'stat', label: '能量', value: '⚡ 120%' },
        ] : [
          { type: 'stat', label: 'Mood', value: '😊 Happy' },
          { type: 'stat', label: 'Status', value: '🐾 By your side' },
          { type: 'stat', label: 'Energy', value: '⚡ 120%' },
        ] },
        { type: 'badge', label: locale === 'zh' ? '超可爱模式' : 'Super Cute Mode', tone: 'success', icon: '🌟' },
        { type: 'progress', label: locale === 'zh' ? '可爱度' : 'Cuteness', value: 100, valueLabel: '100%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '正在给主人准备惊喜喵~' : 'Preparing a delightful surprise for you~', center: true },
      ],
    }],
  }
}

export function createTemplateBSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '🧭 专注模式' : '🧭 Focus', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'badge', label: '就绪', tone: 'success', icon: '🟢' },
          { type: 'badge', label: '处理中', tone: 'accent', icon: '🎯' },
          { type: 'badge', label: '高能', tone: 'warn', icon: '⚡' },
        ] : [
          { type: 'badge', label: 'Ready', tone: 'success', icon: '🟢' },
          { type: 'badge', label: 'Processing', tone: 'accent', icon: '🎯' },
          { type: 'badge', label: 'High Energy', tone: 'warn', icon: '⚡' },
        ] },
        { type: 'progress', label: locale === 'zh' ? '当前任务' : 'Current task', value: 68, valueLabel: '68%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '正在专注处理你的请求。' : 'Focusing fully on your request.', center: true },
      ],
    }],
  }
}

export function createTemplateCSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '🧠 Agent 控制台' : '🧠 Agent Console', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'stat', label: '模式', value: '🔍 分析' },
          { type: 'stat', label: '阶段', value: '🛠️ 执行' },
          { type: 'stat', label: '负载', value: '⚡ 82%' },
        ] : [
          { type: 'stat', label: 'Mode', value: '🔍 Analysis' },
          { type: 'stat', label: 'Stage', value: '🛠️ Execute' },
          { type: 'stat', label: 'Load', value: '⚡ 82%' },
        ] },
        { type: 'badge', label: locale === 'zh' ? '状态正常' : 'All Systems Normal', tone: 'success', icon: '✅' },
        { type: 'progress', label: locale === 'zh' ? '任务进度' : 'Task progress', value: 72, valueLabel: '72%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '正在核对细节并生成可靠结果。' : 'Checking details and preparing a reliable result.', center: true },
      ],
    }],
  }
}

export function createTemplateDSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '🚀 神经甲板' : '🚀 Neural Deck', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'stat', label: '核心', value: '🟣 在线' },
          { type: 'stat', label: '任务', value: '🛰️ 编排中' },
          { type: 'stat', label: '功率', value: '⚡ 96%' },
        ] : [
          { type: 'stat', label: 'Core', value: '🟣 Online' },
          { type: 'stat', label: 'Mission', value: '🛰️ Orchestrating' },
          { type: 'stat', label: 'Power', value: '⚡ 96%' },
        ] },
        { type: 'badge', label: locale === 'zh' ? '深度思考' : 'Deep Thinking', tone: 'accent', icon: '🌌' },
        { type: 'progress', label: locale === 'zh' ? '推理链路' : 'Reasoning path', value: 88, valueLabel: '88%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '信号稳定，正在构建最佳答复。' : 'Signal stable. Constructing the best response.', center: true },
      ],
    }],
  }
}

export function createTemplateESpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '☕ 暖心小站' : '☕ Cozy Corner', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'stat', label: '心情', value: '🥰 温柔' },
          { type: 'stat', label: '陪伴', value: '🫶 进行中' },
          { type: 'stat', label: '温度', value: '🌤️ 98%' },
        ] : [
          { type: 'stat', label: 'Mood', value: '🥰 Gentle' },
          { type: 'stat', label: 'Company', value: '🫶 Present' },
          { type: 'stat', label: 'Warmth', value: '🌤️ 98%' },
        ] },
        { type: 'badge', label: locale === 'zh' ? '安心陪伴模式' : 'Caring Companion', tone: 'success', icon: '🍀' },
        { type: 'progress', label: locale === 'zh' ? '默契度' : 'Rapport', value: 94, valueLabel: '94%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '慢慢来，我会陪你一起把事情做好。' : "Take your time — we'll get this done together.", center: true },
      ],
    }],
  }
}

export function createTemplateFSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', title: locale === 'zh' ? '💻 开发运行时' : '💻 Dev Runtime', items: [
        { type: 'row', gap: 8, items: locale === 'zh' ? [
          { type: 'stat', label: '构建', value: '🟢 就绪' },
          { type: 'stat', label: '任务', value: '🧩 编码中' },
          { type: 'stat', label: 'CPU', value: '⚡ 87%' },
        ] : [
          { type: 'stat', label: 'Build', value: '🟢 Ready' },
          { type: 'stat', label: 'Task', value: '🧩 Coding' },
          { type: 'stat', label: 'CPU', value: '⚡ 87%' },
        ] },
        { type: 'badge', label: locale === 'zh' ? '工程模式' : 'Engineering Mode', tone: 'accent', icon: '🛠️' },
        { type: 'progress', label: locale === 'zh' ? '实现进度' : 'Implementation', value: 76, valueLabel: '76%' },
        { type: 'text', size: 'muted', content: locale === 'zh' ? '正在分析代码、验证改动并准备交付。' : 'Analyzing code, verifying changes, and preparing delivery.', center: true },
      ],
    }],
  }
}

export function parseCustomTemplate(raw: string, cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  if (new TextEncoder().encode(raw).byteLength > 64 * 1024) {
    throw new Error(locale === 'zh' ? '自定义模板不能超过 64 KiB' : 'Custom templates cannot exceed 64 KiB')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(locale === 'zh' ? `自定义模板不是有效 JSON：${detail}` : `Custom template is not valid JSON: ${detail}`)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(locale === 'zh' ? '自定义模板根节点必须是对象' : 'The custom template root must be an object')
  }
  const record = parsed as Record<string, unknown>
  if (!Array.isArray(record.items) || record.items.length === 0) {
    throw new Error(locale === 'zh' ? '自定义模板必须包含非空 items 数组' : 'The custom template must contain a non-empty items array')
  }
  return { ...record, title: cardTitle, items: record.items } as GenuiSpec
}

export function createTemplateSpec(template: TemplateId, cardTitle: string, customTemplate = DEFAULT_CUSTOM_TEMPLATE, locale: Locale = 'zh'): GenuiSpec {
  switch (template) {
    case 'bootstrap': return createBootstrapSpec(cardTitle, locale)
    case 'a': return createTemplateASpec(cardTitle, locale)
    case 'b': return createTemplateBSpec(cardTitle, locale)
    case 'c': return createTemplateCSpec(cardTitle, locale)
    case 'd': return createTemplateDSpec(cardTitle, locale)
    case 'e': return createTemplateESpec(cardTitle, locale)
    case 'f': return createTemplateFSpec(cardTitle, locale)
    case 'custom': {
      const localized = locale === 'en' && customTemplate === DEFAULT_CUSTOM_TEMPLATE ? DEFAULT_CUSTOM_TEMPLATE_EN : customTemplate
      return parseCustomTemplate(localized, cardTitle, locale)
    }
  }
}
