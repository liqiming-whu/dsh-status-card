import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import SettingsForms from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { SystemPrompt, renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import * as statusCard from '../lib/index.js'

// Follow dsh-environment-context's real Loader/Settings integration path.
// Only profile/YAML persistence is replaced: Settings still prepares the edit,
// and the real Entry.update commits into the running fiber's volatile refs.
// This does not exercise disk reloads, the browser transport, or GenUI rendering.
const home = await fs.mkdtemp(join(tmpdir(), 'status-card-settings-'))
const ctx = new Context()
try {
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
  ctx.effect(() => ctx.systemPrompt.section({ name: 'placement-boundary', order: 85, text: 'PLACEMENT_BOUNDARY' }))
  ctx.provide('profileContext', { home, name: 'test-profile', dir: home, installAnchor: home })
  await ctx.plugin(Loader)

  let pluginApplies = 0
  let pluginDisposals = 0
  const entryId = statusCard.SETTINGS_NAMESPACE
  ctx.loader.builtins[entryId] = {
    ...statusCard,
    apply(pluginCtx, config) {
      pluginApplies += 1
      pluginCtx.effect(() => () => { pluginDisposals += 1 })
      return statusCard.apply(pluginCtx, config)
    },
  }
  const initialSettings = {
    enabled: true, locale: 'zh', cardTitle: '初始标题 {{literal}}',
    template: 'bootstrap', customTemplate: statusCard.DEFAULT_CUSTOM_TEMPLATE,
  }
  await ctx.loader.create({
    id: entryId, name: `cordis:${entryId}`,
    config: { ...initialSettings, sectionOrder: 73 },
  })
  await ctx.loader.await()
  const entry = ctx.loader.resolve(entryId)
  const fiber = entry.fiber
  const liveConfig = fiber.config
  const refs = Object.fromEntries(Object.keys(initialSettings).map(key => [key, liveConfig[key]]))
  const volatileCommits = []
  fiber.ctx.on('loader/volatile-update', paths => volatileCommits.push(paths.map(path => path.join('.')).sort()))
  assert.equal(pluginApplies, 1)

  ctx.provide('configEditor', {
    documentPath: join(home, 'cordis.patch.yml'),
    entries: () => [...ctx.loader.entries()],
    configuration: () => [...ctx.loader.entries()].map(row => ({ entry: row, inherited: {}, override: {} })),
    async edit(target, change) {
      const next = change(structuredClone(target.options.config ?? {}), {})
      await target.update({ config: next }, false, true)
    },
  })
  // Install Settings after the card, exercising its optional settings injection.
  await ctx.plugin(SettingsForms)
  const descriptor = () => ctx.settings.describe().find(row => row.ns === entryId)
  assert.equal(descriptor().autoGenerate, false)
  assert.deepEqual(Object.keys(descriptor().value).sort(), Object.keys(initialSettings).sort())
  const form = new z(descriptor().schema)
  assert.deepEqual(Object.keys(form.dict).sort(), Object.keys(initialSettings).sort())
  assert.equal(form.dict.sectionOrder, undefined)

  const assemble = async (expectedSettings, order = 73) => {
    const assembly = await ctx.systemPrompt.assemble()
    assert.equal(assembly.contexts.length, 0, 'no dynamic prompt context or conversation history')
    const sections = assembly.sections.filter(section => section.name === statusCard.name)
    assert.equal(sections.length, 1, 'exactly one status-card section, including while disabled')
    const section = sections[0]
    const cardIndex = assembly.sections.indexOf(section)
    const boundaryIndex = assembly.sections.findIndex(row => row.name === 'placement-boundary')
    assert.ok(boundaryIndex >= 0)
    assert.equal(cardIndex < boundaryIndex, order < 85, 'ordinary placement controls assembly order')
    assert.equal(section.interpolate, false)
    assert.equal(section.text, statusCard.buildStatusCardInstruction(expectedSettings))
    return { section, rendered: renderPrompt(assembly) }
  }
  let expected = { ...initialSettings }
  let { section, rendered } = await assemble(expected)
  assert.ok(section.text.startsWith('在每次回复正文的最开头'))
  assert.ok(rendered.includes('初始标题 {{literal}}'), 'title stays literal during rendering')

  const save = async patch => {
    const commitsBefore = volatileCommits.length
    await ctx.settings.update(entryId, patch)
    expected = { ...expected, ...patch }
    // Assemble immediately after update resolves: no reload, reinstall or wait.
    const result = await assemble(expected)
    assert.equal(volatileCommits.length, commitsBefore + 1)
    assert.deepEqual(volatileCommits.at(-1), Object.keys(patch).sort())
    assert.equal(entry.fiber, fiber, 'volatile saves retain the running fiber')
    assert.equal(fiber.config, liveConfig, 'volatile saves retain the Config object')
    for (const [key, ref] of Object.entries(refs)) {
      assert.equal(fiber.config[key], ref, `${key} reference must be updated in place`)
      assert.equal(ref.get(), expected[key], `${key} live value must match Settings`)
    }
    assert.deepEqual(descriptor().value, expected)
    assert.equal(descriptor().autoGenerate, false)
    assert.equal(entry.options.config.sectionOrder, 73, 'Settings preserves ordinary config')
    assert.equal(fiber.config.sectionOrder, 73)
    assert.equal(pluginApplies, 1, 'no plugin reapplication on a volatile save')
    assert.equal(pluginDisposals, 0, 'no plugin teardown on a volatile save')
    return result
  }

  ;({ section } = await save({ locale: 'en' }))
  assert.ok(section.text.startsWith('At the very beginning of every reply'))
  assert.ok(section.text.includes('All visible text in the status card must be in English'))
  ;({ section, rendered } = await save({ cardTitle: 'Updated {{literal_title}}' }))
  assert.ok(section.text.includes('Updated {{literal_title}}'))
  assert.ok(!section.text.includes('初始标题'))
  assert.ok(rendered.includes('{{literal_title}}'), 'updated title must not interpolate')
  ;({ section, rendered } = await save({ enabled: false }))
  assert.equal(section.text, '')
  assert.ok(!rendered.includes('Updated {{literal_title}}'))
  // Edit while disabled, then re-enable on the same fiber.
  await save({ locale: 'zh', cardTitle: '重新启用标题' })
  ;({ section } = await save({ enabled: true }))
  assert.ok(section.text.startsWith('在每次回复正文的最开头'))
  assert.ok(section.text.includes('重新启用标题'))

  // The other two volatile fields use the same path, including a template edit
  // after selecting custom mode (the prompt must read it at assembly time).
  await save({ template: 'f' })
  const customTemplate = JSON.stringify({ items: [{ type: 'text', content: 'LIVE_TEMPLATE_ONE' }] })
  ;({ section } = await save({ template: 'custom', customTemplate }))
  assert.ok(section.text.includes('LIVE_TEMPLATE_ONE'))
  ;({ section } = await save({ customTemplate: customTemplate.replace('LIVE_TEMPLATE_ONE', 'LIVE_TEMPLATE_TWO') }))
  assert.ok(section.text.includes('LIVE_TEMPLATE_TWO'))
  assert.ok(!section.text.includes('LIVE_TEMPLATE_ONE'))

  // Settings must reject ordinary fields, even in a mixed patch, atomically.
  const configBefore = structuredClone(entry.options.config)
  const commitsBefore = volatileCommits.length
  await assert.rejects(ctx.settings.update(entryId, { sectionOrder: 99 }), /is not volatile/)
  await assert.rejects(ctx.settings.update(entryId, { enabled: false, sectionOrder: 99 }), /is not volatile/)
  assert.deepEqual(entry.options.config, configBefore)
  assert.equal(volatileCommits.length, commitsBefore)
  assert.equal(pluginApplies, 1)
  assert.equal(pluginDisposals, 0)
  assert.equal(entry.fiber, fiber)
  assert.deepEqual(statusCard.readSettings(fiber.config), expected)
  await assemble(expected)

  // Ordinary Loader edits do reapply the plugin and update placement. This
  // control proves the lifecycle counters can detect the restart boundary.
  await entry.update({ config: { ...entry.options.config, sectionOrder: 99 } }, false, true)
  await ctx.loader.await()
  assert.equal(pluginApplies, 2, 'ordinary config must reapply the plugin')
  assert.equal(pluginDisposals, 1, 'ordinary config must tear down the previous application')
  await assemble(expected, 99)
  assert.deepEqual(descriptor().value, expected)
  assert.equal(descriptor().autoGenerate, false)

  await entry.fiber.dispose()
  assert.equal(pluginDisposals, 2)
  assert.ok(!(await ctx.systemPrompt.assemble()).sections.some(row => row.name === statusCard.name))
} finally {
  try {
    await ctx.fiber.dispose()
  } finally {
    await fs.rm(home, { recursive: true, force: true })
  }
}
console.log('real Loader/Settings volatile status-card integration tests passed')
