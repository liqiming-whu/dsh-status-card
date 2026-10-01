import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import z from '@deepseek-ai/schemastery'
import { Config, DEFAULT_CUSTOM_TEMPLATE } from '../lib/index.js'

// The Host's own form projection, so the round trip below is the real one.
const settingsSchemaUrl = new URL('types/schema.js', import.meta.resolve('@deepseek-ai/dsh-settings'))
assert.ok(settingsSchemaUrl.pathname.endsWith('/lib/types/schema.js'), settingsSchemaUrl.href)
const { volatileForm, projectForm, plainConfig } = await import(settingsSchemaUrl.href)

const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(pkg.dependencies, undefined)
assert.equal(pkg.exports['./client'].default, './lib/client.cjs')
assert.equal(pkg.dsh.client.platform, 'web')
assert.ok(pkg.dsh.client.inject.includes('@changfenhuang/dsh-genui'))
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings'))
assert.equal(pkg.dsh.client.inject.includes('@omdsh-dev/dsh-genui'), false)

const clientSource = await fs.readFile(new URL('../src/client/index.tsx', import.meta.url), 'utf8')
assert.ok(!clientSource.includes("dsh-genui/client'"), 'forbidden cross-plugin client value import')
assert.ok(clientSource.includes('navigator?.languages'))
assert.ok(clientSource.includes("scope.set('locale', browserLocale)"))
// The local preview must match GenUI's row semantics, which ignore `gap`.
const previewSource = await fs.readFile(new URL('../src/client/preview.tsx', import.meta.url), 'utf8')
const rowLine = previewSource.split('\n').find(line => line.includes("if (type === 'row')"))
assert.ok(rowLine, 'preview row branch is missing')
assert.ok(!rowLine.includes('node.gap'), 'preview must not read a row gap: GenUI ignores it')

const bundle = await fs.readFile(new URL('../lib/client.cjs', import.meta.url), 'utf8')
for (const expected of [
  'settings.section',
  '状态卡片',
  'Status Card',
  '使用前请先安装并启用与本机 DSH 匹配的 @changfenhuang/dsh-genui',
  'Install and enable the @changfenhuang/dsh-genui build matching this DSH runtime first',
  '卡片标题',
  'Card title',
  '实时渲染预览',
  'Live rendered preview',
  '自定义 dsh-ui JSON',
  'Custom dsh-ui JSON',
  '保存自定义模板',
  'Save custom template',
  'StatusCardPreview',
  '预览暂不支持组件',
  'Preview does not support component',
]) {
  assert.ok(bundle.includes(expected), `client bundle missing ${expected}`)
}

const host = await fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.ok(!host.includes('installSettingsSection'))
assert.ok(!host.includes('settingsNamespace('))
assert.ok(host.includes('locale: z.union([...LOCALES])'))
assert.ok(!clientSource.includes('settingsScope'))
assert.ok(!clientSource.includes('as never'))
for (const deps of [pkg.peerDependencies, pkg.devDependencies]) {
  for (const [name, version] of Object.entries(deps)) {
    if (name.startsWith('@deepseek-ai/dsh-')) assert.equal(version, '0.2.0-rc.2')
    assert.ok(!['@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-web-react'].includes(name))
  }
}

for (const field of ['enabled', 'locale', 'cardTitle', 'template', 'customTemplate']) {
  assert.equal(Config.dict[field].meta.volatile, true, `${field} must be editable live`)
}
assert.ok(!Config.dict.sectionOrder.meta.volatile)

// The Host projects the volatile fields into a serialized form schema, and the
// browser decodes each namespace value against it; a failed decode leaves the
// whole settings page read-only with defaults on screen. Reproduce that exact
// Host projection here: any field DSH cannot carry across the wire (a
// `z.transform` callback, for instance, whose revived function has no `toJSON`
// and is therefore dropped on the second serialization) must fail this test
// instead of shipping as a dead page.
const form = volatileForm(Config)
assert.deepEqual(Object.keys(form.dict), ['enabled', 'locale', 'cardTitle', 'template', 'customTemplate'])
const value = projectForm(form, plainConfig(Config({})))
const wire = JSON.parse(JSON.stringify(form.toJSON()))
const decoded = new z(wire)
assert.deepEqual(decoded(value), { ...value, customTemplate: DEFAULT_CUSTOM_TEMPLATE })
assert.equal(decoded(value).customTemplate, DEFAULT_CUSTOM_TEMPLATE)
// A user-edited template string and a custom title survive the same decode.
const edited = projectForm(form, plainConfig(Config({ cardTitle: '自定义标题', template: 'f', customTemplate: '{"items":[{"type":"text","content":"x"}]}' })))
assert.equal(decoded(edited).cardTitle, '自定义标题')
assert.equal(decoded(edited).template, 'f')

// Run the actual browser artifact through the ModuleLoader protocol. Only
// React is an allowed value import; collaboration with DSH uses services.
let loaded
const require = createRequire(import.meta.url)
vm.runInNewContext(bundle, {
  window: { __ModuleLoader__: { load: definition => { loaded = definition } } },
  navigator: { languages: ['en-US'], language: 'en-US' },
  TextEncoder,
})
assert.equal(loaded.id, pkg.name)
const client = loaded.factory(id => {
  assert.ok(id === 'react' || id.startsWith('react/'), `cross-plugin runtime import: ${id}`)
  return require(id)
})
assert.deepEqual(Array.from(client.inject), ['slots', 'configForms'])
// Regression: an undecoded snapshot (status !== 'ready') must still leave the
// checkbox and template select operable; only the Host's writability may
// disable them. Values cross a VM realm boundary, so compare fields.
const pendingView = client.settingsViewState({ status: 'loading', writable: true })
assert.equal(pendingView.writable, true)
assert.equal(pendingView.settings.enabled, true)
assert.equal(pendingView.settings.locale, 'zh')
assert.equal(pendingView.settings.cardTitle, 'AI 状态')
assert.equal(pendingView.settings.template, 'bootstrap')
assert.equal(pendingView.settings.customTemplate, DEFAULT_CUSTOM_TEMPLATE)
assert.equal(client.settingsViewState({ status: 'loading', writable: false }).writable, false)
assert.equal(
  client.settingsViewState({ status: 'ready', writable: true, value: { enabled: false, locale: 'en', cardTitle: 'X', template: 'f', customTemplate: '{}' } }).settings.template,
  'f',
)
const scope = {}
let registered
let component
let watchDisposer
const ctx = {
  effect: setup => { watchDisposer = setup() },
  configForms: {
    get(entryId) { assert.equal(entryId, 'status-card'); return scope },
    whileServed(entries, register) {
      assert.deepEqual(Array.from(entries), ['status-card'])
      return register(new Set(entries))
    },
  },
  slots: {
    inject(slot, register) { assert.equal(slot, 'settings.section'); return register() },
    register(options, fn) { registered = options; component = fn; return () => {} },
  },
}
client.apply(ctx)
assert.equal(registered.id, 'status-card')
assert.equal(registered.label(), 'Status Card')
assert.equal(registered.inject().scope, scope)
assert.equal(registered.inject().browserLocale, 'en')
assert.equal(typeof component, 'function')
assert.equal(typeof watchDisposer, 'function')
watchDisposer()
console.log('DSH 0.2 bilingual live settings and browser bundle tests passed')
