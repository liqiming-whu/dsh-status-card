import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(pkg.dependencies['@omdsh-dev/dsh-genui'], 'github:omdsh-dev/dsh-genui')
assert.equal(pkg.exports['./client'].default, './lib/client.cjs')
assert.equal(pkg.dsh.client.platform, 'web')
assert.ok(pkg.dsh.client.inject.includes('@omdsh-dev/dsh-genui'))
assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings'))

const clientSource = await fs.readFile(new URL('../src/client/index.tsx', import.meta.url), 'utf8')
assert.ok(!clientSource.includes("from '@omdsh-dev/dsh-genui/client'"), 'forbidden cross-plugin client value import')

const bundle = await fs.readFile(new URL('../lib/client.cjs', import.meta.url), 'utf8')
for (const expected of [
  'settings.section',
  '状态卡片',
  '卡片标题',
  '实时渲染预览',
  '自定义 dsh-ui JSON',
  '保存自定义模板',
  'StatusCardPreview',
  '预览暂不支持组件',
]) {
  assert.ok(bundle.includes(expected), `client bundle missing ${expected}`)
}

const host = await fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.ok(host.includes('installSettingsSection'))
assert.ok(host.includes("settingsNamespace('status-card')"))
console.log('settings panel tests passed')
