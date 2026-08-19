import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { apply, buildStatusCardInstruction, DEFAULT_CUSTOM_TEMPLATE, detectPreferredLocale } from '../lib/index.js'

const config = { enabled: true, locale: 'zh', cardTitle: 'Agent 状态', template: 'bootstrap', customTemplate: DEFAULT_CUSTOM_TEMPLATE, sectionOrder: 90 }
const prompt = buildStatusCardInstruction(config)
assert.ok(prompt.startsWith('在每次回复正文的最开头'))
assert.ok(prompt.includes('```dsh-ui'))
assert.ok(prompt.includes('Agent 状态'))
assert.ok(prompt.includes('状态卡片中的可见文字必须使用中文'))
assert.ok(prompt.includes('emoji'))
assert.ok(!prompt.includes('Material Icons图标名'))
assert.equal(buildStatusCardInstruction({ ...config, enabled: false }), '')

const englishPrompt = buildStatusCardInstruction({ ...config, locale: 'en', cardTitle: 'AI 状态', template: 'f' })
assert.ok(englishPrompt.startsWith('At the very beginning of every reply'))
assert.ok(englishPrompt.includes('All visible text in the status card must be in English'))
assert.ok(englishPrompt.includes('AI Status'))
assert.ok(englishPrompt.includes('💻 Dev Runtime'))
assert.ok(englishPrompt.includes('Engineering Mode'))
assert.ok(!englishPrompt.includes('正在分析代码'))

assert.equal(detectPreferredLocale(['zh-CN', 'en-US']), 'zh')
assert.equal(detectPreferredLocale(['zh-TW']), 'zh')
assert.equal(detectPreferredLocale(['zh_CN']), 'zh')
assert.equal(detectPreferredLocale(['en-US', 'zh-CN']), 'en')
assert.equal(detectPreferredLocale(['fr-FR']), 'en')
assert.equal(detectPreferredLocale(undefined, 'zh-Hans'), 'zh')
assert.equal(detectPreferredLocale([], ''), 'en')

let capturedSection
let disposed = false
const fakeContext = {
  inject() {},
  effect(register) {
    const dispose = register()
    assert.equal(typeof dispose, 'function')
    return () => dispose()
  },
  systemPrompt: {
    section(section) {
      capturedSection = section
      return () => { disposed = true }
    },
  },
}
apply(fakeContext, config)
assert.equal(capturedSection.name, 'status-card')
assert.equal(capturedSection.order, 90)
assert.equal(capturedSection.text({}), prompt)
assert.equal(disposed, false)

// The plugin succeeds with only the systemPrompt seam. It never receives a
// sessions/agents handle and therefore cannot append user/assistant history.
const source = await fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
for (const forbidden of ['systemPrompt.context(', 'agent.inject(', "ctx.on('session/event'", 'user/message', 'assistant/message']) {
  assert.ok(!source.includes(forbidden), `history-producing API found: ${forbidden}`)
}
assert.ok(source.includes('systemPrompt.section({'))
console.log('bilingual non-history system prompt injection tests passed')
