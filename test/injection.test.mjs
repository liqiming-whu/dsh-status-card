import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { apply, buildStatusCardInstruction, DEFAULT_CUSTOM_TEMPLATE } from '../lib/index.js'

const config = { enabled: true, cardTitle: 'Agent 状态', template: 'bootstrap', customTemplate: DEFAULT_CUSTOM_TEMPLATE, sectionOrder: 90 }
const prompt = buildStatusCardInstruction(config)
assert.ok(prompt.startsWith('在每次回复正文的最开头'))
assert.ok(prompt.includes('```dsh-ui'))
assert.ok(prompt.includes('Agent 状态'))
assert.ok(prompt.includes('emoji'))
assert.ok(!prompt.includes('Material Icons图标名'))
assert.equal(buildStatusCardInstruction({ ...config, enabled: false }), '')

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
console.log('non-history system prompt injection tests passed')
