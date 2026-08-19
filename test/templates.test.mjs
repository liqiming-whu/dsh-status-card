import assert from 'node:assert/strict'
import { createTemplateSpec, DEFAULT_CUSTOM_TEMPLATE, parseCustomTemplate, TEMPLATE_OPTIONS } from '../lib/index.js'

function inspect(id, expectedParts) {
  const spec = createTemplateSpec(id, '自定义标题')
  assert.equal(spec.title, '自定义标题')
  assert.ok(Array.isArray(spec.items) && spec.items.length > 0)
  const text = JSON.stringify(spec)
  for (const part of expectedParts) assert.ok(text.includes(part), `${id} missing ${part}`)
  for (const forbidden of ['favorite', 'emoji_emotions', 'bolt', '<html', '<metric']) {
    assert.ok(!text.includes(forbidden), `${id} contains forbidden legacy token ${forbidden}`)
  }
  return spec
}

inspect('bootstrap', ['✅', '🧠', '⚡'])
inspect('a', ['🌸 AI 状态', '😊 开心', '🐾 陪伴中', '🌟', '可爱度'])
inspect('b', ['🧭 Focus', '🟢', '🎯', '当前任务', '正在专注处理你的请求。'])
inspect('c', ['🧠 Agent Console', '🔍 分析', '🛠️ 执行', '状态正常', '可靠结果'])
inspect('d', ['🚀 Neural Deck', '🟣 Online', '🛰️ 编排中', '🌌', '推理链路'])
inspect('e', ['☕ 暖心小站', '🥰 温柔', '🫶 陪伴中', '🍀', '默契度'])
inspect('f', ['💻 Dev Runtime', '🟢 Ready', '🧩 Coding', '🛠️', '实现进度'])
const custom = createTemplateSpec('custom', '我的标题', DEFAULT_CUSTOM_TEMPLATE)
assert.equal(custom.title, '我的标题')
assert.ok(JSON.stringify(custom).includes('🎨 我的状态'))
assert.throws(() => parseCustomTemplate('{broken', 'x'), /不是有效 JSON/)
assert.throws(() => parseCustomTemplate('{"items":[]}', 'x'), /非空 items 数组/)
assert.deepEqual(TEMPLATE_OPTIONS.map(option => option.id), ['bootstrap', 'a', 'b', 'c', 'd', 'e', 'f', 'custom'])
console.log('templates A-F and custom tests passed')
