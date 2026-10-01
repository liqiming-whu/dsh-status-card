import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import { SystemPrompt, renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import { apply, Config, readSettings, buildStatusCardInstruction, DEFAULT_CUSTOM_TEMPLATE, detectPreferredLocale, parseCustomTemplate } from '../lib/index.js'

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

const parsedConfig = Config(config)
assert.deepEqual(readSettings(parsedConfig), {
  enabled: config.enabled, locale: config.locale, cardTitle: config.cardTitle,
  template: config.template, customTemplate: config.customTemplate,
})
assert.equal(Config({}).enabled.get(), true)
assert.equal(Config({}).customTemplate.get(), DEFAULT_CUSTOM_TEMPLATE)
// The Config schema keeps customTemplate a plain string: DSH cannot carry a
// `z.transform` callback through the settings form projection, so validating it
// there would make the browser decode fail and the settings page read-only.
// `parseCustomTemplate` validates user input in the settings UI instead, and
// injection falls back to the bootstrap template for an unusable string.
assert.equal(Config({ customTemplate: '{broken' }).customTemplate.get(), '{broken')
assert.throws(() => parseCustomTemplate('{broken'), /不是有效 JSON/)
assert.throws(() => parseCustomTemplate('{"items":[]}'), /非空 items 数组/)
assert.throws(() => parseCustomTemplate('x'.repeat(65537)), /64 KiB/)
assert.equal(buildStatusCardInstruction({ ...config, template: 'custom', customTemplate: '{broken' }), prompt)
assert.throws(() => Config({ locale: 'fr' }))

let capturedSection
let disposed = false
let disposeSection
let settingsPolicy
const fiber = {}
const fakeContext = {
  fiber,
  inject(keys, callback) {
    assert.deepEqual(keys, ['settings'])
    callback({
      effect: register => register(),
      settings: { configure(policy, owner) {
        assert.equal(owner, fiber)
        settingsPolicy = policy
        return () => {}
      } },
    })
  },
  effect(register) {
    const dispose = register()
    assert.equal(typeof dispose, 'function')
    disposeSection = dispose
    return () => dispose()
  },
  systemPrompt: {
    section(section) {
      capturedSection = section
      return () => { disposed = true }
    },
  },
}
// Refs model the Loader's live values; no history or agent service exists here.
const live = { ...config }
const refs = Object.fromEntries(Object.keys(config).map(key => [key,
  key === 'sectionOrder' ? config[key] : { get: () => live[key] },
]))
apply(fakeContext, refs)
assert.deepEqual(settingsPolicy, { auto: false })
assert.equal(capturedSection.name, 'status-card')
assert.equal(capturedSection.order, 90)
assert.equal(capturedSection.interpolate, false)
assert.equal(capturedSection.text({}), prompt)
live.enabled = false
assert.equal(capturedSection.text({}), '')
live.enabled = true
live.locale = 'en'
live.cardTitle = 'Updated {{not_a_prompt_variable}}'
assert.ok(capturedSection.text({}).includes('Updated {{not_a_prompt_variable}}'))
assert.ok(capturedSection.text({}).includes('All visible text in the status card must be in English'))
assert.equal(disposed, false)
disposeSection()
assert.equal(disposed, true)

// Exercise the current DSH prompt service, not only a structural mock.
const ctx = new Context()
await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
const pluginFiber = await ctx.plugin({ name: 'status-card-test', inject: ['systemPrompt'], apply: pluginCtx => apply(pluginCtx, refs) })
const assembly = await ctx.systemPrompt.assemble()
assert.equal(assembly.contexts.length, 0)
assert.ok(renderPrompt(assembly).includes('{{not_a_prompt_variable}}'))
live.enabled = false
assert.equal((await ctx.systemPrompt.assemble()).sections.find(section => section.name === 'status-card').text, '')
await pluginFiber.dispose()
assert.ok(!(await ctx.systemPrompt.assemble()).sections.some(section => section.name === 'status-card'))
await ctx.fiber.dispose()

// The plugin succeeds with only the systemPrompt seam. It never receives a
// sessions/agents handle and therefore cannot append user/assistant history.
const source = await fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
for (const forbidden of ['systemPrompt.context(', 'agent.inject(', "ctx.on('session/event'", 'user/message', 'assistant/message']) {
  assert.ok(!source.includes(forbidden), `history-producing API found: ${forbidden}`)
}
assert.ok(source.includes('systemPrompt.section({'))
console.log('bilingual non-history system prompt injection tests passed')
