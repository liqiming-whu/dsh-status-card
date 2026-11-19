import assert from 'node:assert/strict'
import { createTemplateSpec, DEFAULT_CUSTOM_TEMPLATE, getTemplateOptions, parseCustomTemplate, TEMPLATE_OPTIONS } from '../lib/index.js'

function inspect(id, expectedParts, locale = 'zh') {
  const title = locale === 'zh' ? '自定义标题' : 'Custom Title'
  const spec = createTemplateSpec(id, title, DEFAULT_CUSTOM_TEMPLATE, locale)
  assert.equal(spec.title, title)
  assert.ok(Array.isArray(spec.items) && spec.items.length > 0)
  const text = JSON.stringify(spec)
  for (const part of expectedParts) assert.ok(text.includes(part), `${locale}/${id} missing ${part}`)
  for (const forbidden of ['favorite', 'emoji_emotions', 'bolt', '<html', '<metric']) {
    assert.ok(!text.includes(forbidden), `${locale}/${id} contains forbidden legacy token ${forbidden}`)
  }
  if (locale === 'en') assert.ok(!/[\u3400-\u9fff]/u.test(text), `en/${id} contains Chinese visible text`)
  return spec
}

// GenUI's `row` is a fixed 12px flex row: its schema accepts only
// items/wrap/spacer and its renderer never reads `gap` (only `col` does), so a
// `gap` there is silently dropped and raises an unknown-field warning. Lock the
// constraint down so a template edit cannot quietly reintroduce it.
function assertNoRowGap(spec, label) {
  const walk = (value, path) => {
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}[${index}]`))
    if (value === null || typeof value !== 'object') return
    if (value.type === 'row' && 'gap' in value) throw new Error(`${label}: row at ${path} carries an unsupported gap`)
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
  }
  walk(spec, '$')
}
for (const locale of ['zh', 'en']) {
  for (const id of ['bootstrap', 'a', 'b', 'c', 'd', 'e', 'f', 'custom']) {
    assertNoRowGap(createTemplateSpec(id, '标题', DEFAULT_CUSTOM_TEMPLATE, locale), `${locale}/${id}`)
  }
}

inspect('bootstrap', ['就绪', '处理中', '当前任务'])
inspect('a', ['🐾 小窝状态', '元气值', '超开心', '陪伴中', '超可爱模式', '"variant":"ring"'])
inspect('b', ['🧭 专注模式', '处理中', '当前任务', '低干扰', '"flat":true'])
inspect('c', ['🧠 Agent 控制台', '🔍 分析', '🛠️ 执行', '✅ 校验', '可靠结果'])
inspect('d', ['🚀 神经甲板', '推理深度', '核心功率', '深度思考', '"spark"'])
inspect('e', ['☕ 暖心小站', '温柔陪伴中', '默契度', '安心模式'])
inspect('f', ['🧩 正在编码', '构建', '测试', '实现进度', '"mono":true'])

inspect('bootstrap', ['Ready', 'Processing', 'Current task'], 'en')
inspect('a', ['🐾 Cozy Status', 'Energy', 'Happy', 'By your side', 'Super Cute Mode'], 'en')
inspect('b', ['🧭 Focus', 'Processing', 'Current task', 'Low distraction'], 'en')
inspect('c', ['🧠 Agent Console', '🔍 Analysis', '🛠️ Execute', '✅ Verify', 'reliable result'], 'en')
inspect('d', ['🚀 Neural Deck', 'Reasoning', 'Core power', 'Deep Thinking'], 'en')
inspect('e', ['☕ COZY CORNER', 'Gently here', 'Rapport', 'Calm Mode'], 'en')
inspect('f', ['🧩 Coding', 'Build', 'Tests', 'Implementation', 'pnpm run check'], 'en')

// Every preset stays inside fields GenUI actually reads, so a template edit
// cannot silently ship an unknown-field warning into every reply.
const ALLOWED = {
  card: ['type', 'title', 'eyebrow', 'accent', 'flat', 'tone', 'items'],
  grid: ['type', 'cols', 'items'], col: ['type', 'gap', 'items', 'width'],
  row: ['type', 'items', 'wrap', 'spacer', 'justify'],
  stat: ['type', 'label', 'value', 'delta', 'spark'],
  progress: ['type', 'label', 'value', 'valueLabel', 'variant', 'target'],
  badge: ['type', 'label', 'tone', 'icon'], keyvalue: ['type', 'pairs'], divider: ['type', 'label'],
  text: ['type', 'size', 'content', 'tone', 'mono', 'align'],
}
for (const locale of ['zh', 'en']) {
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const spec = createTemplateSpec(id, 'x', DEFAULT_CUSTOM_TEMPLATE, locale)
    const walk = node => {
      if (Array.isArray(node)) return node.forEach(walk)
      if (node === null || typeof node !== 'object' || typeof node.type !== 'string') return
      const allowed = ALLOWED[node.type]
      assert.ok(allowed, `${locale}/${id}: unexpected component ${node.type}`)
      for (const key of Object.keys(node)) assert.ok(allowed.includes(key), `${locale}/${id}: ${node.type}.${key} is not a GenUI field`)
      if (node.type === 'stat') assert.ok([...node.value].length <= 6, `${locale}/${id}: stat value too long for display size: ${node.value}`)
      if (node.type === 'badge') assert.ok(['success', 'warn', 'danger', 'accent'].includes(node.tone))
      if (Array.isArray(node.items)) walk(node.items)
    }
    walk(spec.items)
  }
}

const custom = createTemplateSpec('custom', '我的标题', DEFAULT_CUSTOM_TEMPLATE)
assert.equal(custom.title, '我的标题')
assert.ok(JSON.stringify(custom).includes('🎨 我的状态'))
const englishCustom = createTemplateSpec('custom', 'My Title', DEFAULT_CUSTOM_TEMPLATE, 'en')
assert.ok(JSON.stringify(englishCustom).includes('🎨 My Status'))
assert.throws(() => parseCustomTemplate('{broken', 'x'), /不是有效 JSON/)
assert.throws(() => parseCustomTemplate('{broken', 'x', 'en'), /not valid JSON/)
assert.throws(() => parseCustomTemplate('{"items":[]}', 'x'), /非空 items 数组/)
assert.throws(() => parseCustomTemplate('{"items":[]}', 'x', 'en'), /non-empty items array/)
assert.deepEqual(TEMPLATE_OPTIONS.map(option => option.id), ['bootstrap', 'a', 'b', 'c', 'd', 'e', 'f', 'custom'])
assert.equal(getTemplateOptions('zh')[1].label, 'A · 软萌活力')
assert.equal(getTemplateOptions('en')[1].label, 'A · Soft Vitality')
console.log('bilingual templates A-F, GenUI field whitelist and custom tests passed')
