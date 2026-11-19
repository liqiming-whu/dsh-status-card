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
    { id: 'a', label: 'A · 软萌活力', description: '环形元气盘 + 心情键值' },
    { id: 'b', label: 'B · 极简专注', description: '单行状态 + 目标进度条' },
    { id: 'c', label: 'C · 专业工作', description: '三阶段流水线看板' },
    { id: 'd', label: 'D · 星舰科技', description: '微趋势遥测仪表盘' },
    { id: 'e', label: 'E · 温暖陪伴', description: '默契环 + 温柔寄语' },
    { id: 'f', label: 'F · 开发者终端', description: '构建 / 测试 / Diff 终端' },
    { id: 'custom', label: '自定义模板', description: '编辑 JSON 并实时预览' },
  ],
  en: [
    { id: 'bootstrap', label: 'Basic Status', description: 'Short, general-purpose status' },
    { id: 'a', label: 'A · Soft Vitality', description: 'Energy ring + mood sheet' },
    { id: 'b', label: 'B · Minimal Focus', description: 'One status line + target bar' },
    { id: 'c', label: 'C · Professional Work', description: 'Three-stage pipeline board' },
    { id: 'd', label: 'D · Neural Deck', description: 'Sparkline telemetry dashboard' },
    { id: 'e', label: 'E · Warm Companion', description: 'Rapport ring + gentle note' },
    { id: 'f', label: 'F · Developer Runtime', description: 'Build / test / diff terminal' },
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
        type: 'row', items: locale === 'zh' ? [
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

// Built-in presets A–F. Every preset uses only GenUI fields the renderer
// actually reads (card.eyebrow/accent/flat, stat.delta/spark, progress
// variant/target, text tone/mono/align, row spacer/justify). `row` never
// carries `gap` (see AGENT_NOTE). Stat values stay short — GenUI renders
// them as a large display number, so prose belongs in `delta` instead.
const pick = <T>(locale: Locale, zh: T, en: T): T => locale === 'zh' ? zh : en

/** A · 软萌活力 — ring energy gauge + key/value mood sheet, pink accent. */
export function createTemplateASpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', accent: '#ec4899',
      eyebrow: t('🌸 软萌模式 · 在线陪伴', '🌸 SOFT MODE · ONLINE'),
      title: t('🐾 小窝状态', '🐾 Cozy Status'),
      items: [
        { type: 'grid', cols: 2, items: [
          { type: 'progress', variant: 'ring', label: t('⚡ 元气值', '⚡ Energy'), value: 96, valueLabel: '96%' },
          { type: 'keyvalue', pairs: [
            { key: t('心情', 'Mood'), value: t('😊 **超开心**', '😊 **Happy**') },
            { key: t('状态', 'Status'), value: t('🐾 ==陪伴中==', '🐾 ==By your side==') },
            { key: t('默契', 'Rapport'), value: '💖 100%' },
          ] },
        ] },
        { type: 'row', spacer: true, items: [
          { type: 'badge', label: t('超可爱模式', 'Super Cute Mode'), tone: 'accent', icon: '🌟' },
          { type: 'text', size: 'caption', tone: 'muted', content: t('正在给你准备小惊喜喵~', 'Preparing a little surprise for you~') },
        ] },
      ],
    }],
  }
}

/** B · 极简专注 — one flat line of status plus a single targeted progress bar. */
export function createTemplateBSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', flat: true, title: t('🧭 专注模式', '🧭 Focus'),
      items: [
        { type: 'row', spacer: true, items: [
          { type: 'badge', label: t('处理中', 'Processing'), tone: 'accent', icon: '🎯' },
          { type: 'text', size: 'caption', tone: 'muted', content: t('低干扰 · 只做当前这件事', 'Low distraction · one thing at a time') },
        ] },
        { type: 'progress', label: t('当前任务', 'Current task'), value: 68, target: 80, valueLabel: '68%' },
      ],
    }],
  }
}

/** C · 专业工作 — three-stage pipeline stats, steady blue, target-marked progress. */
export function createTemplateCSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', accent: '#315e9b',
      eyebrow: t('📋 工作台 · 第 2 / 3 阶段', '📋 WORKBENCH · STAGE 2 / 3'),
      title: t('🧠 Agent 控制台', '🧠 Agent Console'),
      items: [
        { type: 'grid', cols: 3, items: [
          { type: 'stat', label: t('🔍 分析', '🔍 Analysis'), value: '✓', delta: t('+需求已对齐', '+Scope aligned') },
          { type: 'stat', label: t('🛠️ 执行', '🛠️ Execute'), value: '72%', delta: t('+进行中', '+In progress') },
          { type: 'stat', label: t('✅ 校验', '✅ Verify'), value: '—', delta: t('待开始', 'Pending') },
        ] },
        { type: 'progress', label: t('整体进度', 'Overall progress'), value: 72, target: 100, valueLabel: '72%' },
        { type: 'text', size: 'caption', tone: 'muted', align: 'center', content: t('正在核对细节并生成可靠结果。', 'Checking details and preparing a reliable result.') },
      ],
    }],
  }
}

/** D · 星舰科技 — sparkline telemetry dashboard with a badge status bar. */
export function createTemplateDSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', accent: '#8b5cf6',
      eyebrow: t('🛰️ NEURAL DECK · 信号稳定', '🛰️ NEURAL DECK · SIGNAL STABLE'),
      title: t('🚀 神经甲板', '🚀 Neural Deck'),
      items: [
        { type: 'grid', cols: 3, items: [
          { type: 'stat', label: t('🧠 推理深度', '🧠 Reasoning'), value: '88%', delta: t('+链路展开', '+Expanding'), spark: [52, 61, 70, 79, 88] },
          { type: 'stat', label: t('⚡ 核心功率', '⚡ Core power'), value: '96%', delta: t('+满载', '+Full load'), spark: [80, 86, 91, 94, 96] },
          { type: 'stat', label: t('📡 延迟', '📡 Latency'), value: '0.1s', delta: t('+低抖动', '+Low jitter'), spark: [9, 6, 4, 2, 1] },
        ] },
        { type: 'divider' },
        { type: 'row', spacer: true, items: [
          { type: 'badge', label: t('深度思考', 'Deep Thinking'), tone: 'accent', icon: '🌌' },
          { type: 'text', size: 'caption', tone: 'muted', content: t('正在构建最佳答复…', 'Constructing the best response…') },
        ] },
      ],
    }],
  }
}

/** E · 温暖陪伴 — soft amber ring with a gentle note; no hard numbers wall. */
export function createTemplateESpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', accent: '#f59e0b',
      eyebrow: t('☕ 暖心小站', '☕ COZY CORNER'),
      title: t('🫶 慢慢来，我在', '🫶 Take your time'),
      items: [
        { type: 'grid', cols: 2, items: [
          { type: 'progress', variant: 'ring', label: t('🤝 默契度', '🤝 Rapport'), value: 94, valueLabel: '94%' },
          { type: 'col', gap: 6, items: [
            { type: 'text', size: 'h3', content: t('🥰 温柔陪伴中', '🥰 Gently here') },
            { type: 'text', size: 'body', tone: 'muted', content: t('一步一步来，我会陪你把事情做好。', "One step at a time — we'll get this done together.") },
            { type: 'badge', label: t('安心模式', 'Calm Mode'), tone: 'success', icon: '🍀' },
          ] },
        ] },
      ],
    }],
  }
}

/** F · 开发者终端 — build/test/diff telemetry with a monospace command line. */
export function createTemplateFSpec(cardTitle: string, locale: Locale = 'zh'): GenuiSpec {
  const t = (zh: string, en: string) => pick(locale, zh, en)
  return {
    title: cardTitle, gap: 10, items: [{
      type: 'card', accent: '#10b981',
      eyebrow: t('💻 DEV RUNTIME · main', '💻 DEV RUNTIME · main'),
      title: t('🧩 正在编码', '🧩 Coding'),
      items: [
        { type: 'grid', cols: 3, items: [
          { type: 'stat', label: t('🏗️ 构建', '🏗️ Build'), value: 'OK', delta: t('+tsc 通过', '+tsc clean') },
          { type: 'stat', label: t('🧪 测试', '🧪 Tests'), value: '12/12', delta: t('+全部通过', '+All passing') },
          { type: 'stat', label: t('📝 改动', '📝 Diff'), value: '+48', delta: '-12' },
        ] },
        { type: 'progress', label: t('实现进度', 'Implementation'), value: 76, target: 100, valueLabel: '76%' },
        { type: 'text', size: 'caption', mono: true, tone: 'success', content: t('$ pnpm run check  # 正在验证改动', '$ pnpm run check  # verifying changes') },
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
