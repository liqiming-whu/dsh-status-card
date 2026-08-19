import React, { useEffect, useState, useSyncExternalStore } from 'react'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import {
  createTemplateSpec,
  DEFAULT_CUSTOM_TEMPLATE,
  parseCustomTemplate,
  TEMPLATE_OPTIONS,
  type TemplateId,
} from '../templates.ts'
import type { StatusCardSettings } from '../index.ts'
import { StatusCardPreview } from './preview.tsx'

const defaults: StatusCardSettings = {
  enabled: true,
  cardTitle: 'AI 状态',
  template: 'bootstrap',
  customTemplate: DEFAULT_CUSTOM_TEMPLATE,
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
  const [customDraft, setCustomDraft] = useState(settings.customTemplate)
  const [saveStatus, setSaveStatus] = useState('')
  useEffect(() => setCustomDraft(settings.customTemplate), [settings.customTemplate])

  const set = <K extends keyof StatusCardSettings>(key: K, value: StatusCardSettings[K]) => void scope.set(key, value)
  const title = settings.cardTitle.trim() || defaults.cardTitle

  let preview: React.ReactNode
  let previewError = ''
  try {
    const previewSpec = createTemplateSpec(
      settings.template,
      title,
      settings.template === 'custom' ? customDraft : settings.customTemplate,
    )
    preview = <StatusCardPreview spec={previewSpec} />
  } catch (error) {
    previewError = error instanceof Error ? error.message : String(error)
    preview = null
  }

  const saveCustomTemplate = async () => {
    try {
      parseCustomTemplate(customDraft, title)
      await scope.set('customTemplate', customDraft)
      setSaveStatus('已保存，自定义模板会立即用于后续回复。')
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : String(error))
    }
  }

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

        {settings.template === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>
              自定义 dsh-ui JSON
              <textarea
                value={customDraft}
                disabled={!state.writable}
                rows={12}
                spellCheck={false}
                onChange={event => { setCustomDraft(event.target.value); setSaveStatus('') }}
                style={{ display: 'block', width: '100%', marginTop: 6, fontFamily: 'ui-monospace, monospace' }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" disabled={!state.writable || Boolean(previewError)} onClick={() => void saveCustomTemplate()}>
                保存自定义模板
              </button>
              <span style={{ color: previewError ? 'var(--dsw-alias-color-danger, #d33)' : undefined }}>
                {previewError || saveStatus || '标题由上方“卡片标题”统一覆盖。'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <strong>实时渲染预览</strong>
        {previewError
          ? <div role="alert" style={{ color: 'var(--dsw-alias-color-danger, #d33)' }}>{previewError}</div>
          : <div aria-label="状态卡片预览">{preview}</div>}
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
