import React, { useSyncExternalStore } from 'react'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import { renderGenuiFence } from '@omdsh-dev/dsh-genui/client'
import { createTemplateSpec, TEMPLATE_OPTIONS, type TemplateId } from '../templates.ts'
import type { StatusCardSettings } from '../index.ts'

const defaults: StatusCardSettings = {
  enabled: true,
  cardTitle: 'AI 状态',
  template: 'bootstrap',
}

function decode(value: unknown): StatusCardSettings | undefined {
  if (value === null || typeof value !== 'object') return undefined
  return { ...defaults, ...(value as Partial<StatusCardSettings>) }
}

const sectionStyle: React.CSSProperties = {
  maxWidth: 820,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  border: '1px solid var(--dsw-alias-border-l2, #ccc)',
  borderRadius: 12,
}

function StatusCardSettingsSection({ scope }: { scope: SettingsScope<StatusCardSettings> }) {
  const state = useSyncExternalStore(
    scope.subscribe.bind(scope),
    scope.getSnapshot.bind(scope),
  )
  const settings = state.value ?? defaults
  const set = <K extends keyof StatusCardSettings>(key: K, value: StatusCardSettings[K]) => void scope.set(key, value)
  const previewSpec = createTemplateSpec(settings.template, settings.cardTitle.trim() || defaults.cardTitle)
  const preview = renderGenuiFence(JSON.stringify(previewSpec), 'status-card-settings-preview')

  return (
    <section style={sectionStyle}>
      <div>
        <h2 style={{ margin: 0 }}>状态卡片</h2>
        <p style={{ marginBottom: 0 }}>在每次 Agent 回复开头注入 dsh-ui 状态卡片格式要求。注入位于系统提示组装层，不写入对话历史。</p>
      </div>

      <div style={panelStyle}>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            disabled={!state.writable}
            onChange={event => set('enabled', event.target.checked)}
          />{' '}
          启用回复状态卡片
        </label>

        <label>
          卡片标题
          <input
            value={settings.cardTitle}
            disabled={!state.writable}
            maxLength={80}
            placeholder="例如：AI 状态"
            onChange={event => set('cardTitle', event.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 6 }}
          />
        </label>

        <label>
          模板
          <select
            value={settings.template}
            disabled={!state.writable}
            onChange={event => set('template', event.target.value as TemplateId)}
            style={{ display: 'block', width: '100%', marginTop: 6 }}
          >
            {TEMPLATE_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>{option.label} · {option.description}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={panelStyle}>
        <strong>实时渲染预览</strong>
        <div aria-label="状态卡片预览">{preview}</div>
      </div>
    </section>
  )
}

export const inject = ['slots', 'settingsScope']

export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<StatusCardSettings>({
    namespace: 'status-card',
    decode,
  })
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'status-card',
    order: 36,
    label: () => '状态卡片',
    inject: () => ({ scope }),
  }, StatusCardSettingsSection as never))
}
