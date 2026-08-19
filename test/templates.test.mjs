import assert from 'node:assert/strict'
import { createTemplateSpec, TEMPLATE_OPTIONS } from '../lib/index.js'

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
assert.deepEqual(TEMPLATE_OPTIONS.map(option => option.id), ['bootstrap', 'a'])
console.log('template A tests passed')
