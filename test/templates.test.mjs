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

inspect('bootstrap', ['就绪', '处理中', '当前任务'])
inspect('a', ['🌸 AI 状态', '😊 开心', '🐾 陪伴中', '超可爱模式', '可爱度'])
inspect('b', ['🧭 专注模式', '就绪', '处理中', '当前任务', '正在专注处理你的请求。'])
inspect('c', ['🧠 Agent 控制台', '🔍 分析', '🛠️ 执行', '状态正常', '可靠结果'])
inspect('d', ['🚀 神经甲板', '🟣 在线', '🛰️ 编排中', '深度思考', '推理链路'])
inspect('e', ['☕ 暖心小站', '🥰 温柔', '🫶 进行中', '安心陪伴模式', '默契度'])
inspect('f', ['💻 开发运行时', '🟢 就绪', '🧩 编码中', '工程模式', '实现进度'])

inspect('bootstrap', ['Ready', 'Processing', 'Current task'], 'en')
inspect('a', ['🌸 AI Status', '😊 Happy', '🐾 By your side', 'Super Cute Mode', 'Cuteness'], 'en')
inspect('b', ['🧭 Focus', 'Ready', 'Processing', 'Current task', 'Focusing fully on your request.'], 'en')
inspect('c', ['🧠 Agent Console', '🔍 Analysis', '🛠️ Execute', 'All Systems Normal', 'reliable result'], 'en')
inspect('d', ['🚀 Neural Deck', '🟣 Online', '🛰️ Orchestrating', 'Deep Thinking', 'Reasoning path'], 'en')
inspect('e', ['☕ Cozy Corner', '🥰 Gentle', '🫶 Present', 'Caring Companion', 'Rapport'], 'en')
inspect('f', ['💻 Dev Runtime', '🟢 Ready', '🧩 Coding', 'Engineering Mode', 'Implementation'], 'en')

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
console.log('bilingual templates A-F and custom tests passed')
