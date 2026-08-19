import React, { useEffect, useState, useSyncExternalStore } from 'react'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import { detectPreferredLocale } from '../locale.ts'
import {
  createTemplateSpec,
  defaultCardTitle,
  DEFAULT_CUSTOM_TEMPLATE,
  getTemplateOptions,
  localizeDefaultTitle,
  parseCustomTemplate,
  type Locale,
  type TemplateId,
} from '../templates.ts'
import type { StatusCardSettings } from '../index.ts'
import { StatusCardPreview } from './preview.tsx'

const defaults: StatusCardSettings = {
  enabled: true,
  locale: 'zh',
  cardTitle: 'AI 状态',
  template: 'bootstrap',
  customTemplate: DEFAULT_CUSTOM_TEMPLATE,
}

const messages = {
  zh: {
    title: '状态卡片',
    description: '在每次 Agent 回复开头注入 dsh-ui 状态卡片格式要求。注入位于系统提示组装层，不写入对话历史。',
    enabled: '启用回复状态卡片',
    cardTitle: '卡片标题',
    titlePlaceholder: '例如：AI 状态',
    template: '模板',
    customJson: '自定义 dsh-ui JSON',
    saveCustom: '保存自定义模板',
    saved: '已保存。请新建会话以应用自定义模板。',
    titleOverride: '标题由上方“卡片标题”统一覆盖。',
    preview: '实时渲染预览',
    previewLabel: '状态卡片预览',
  },
  en: {
    title: 'Status Card',
    description: 'Inject a dsh-ui status-card format requirement at the start of every agent reply. The instruction is assembled in the system prompt and is not written to conversation history.',
    enabled: 'Enable reply status cards',
    cardTitle: 'Card title',
    titlePlaceholder: 'For example: AI Status',
    template: 'Template',
    customJson: 'Custom dsh-ui JSON',
    saveCustom: 'Save custom template',
    saved: 'Saved. Start a new conversation to apply the custom template.',
    titleOverride: 'The “Card title” field above overrides the template title.',
    preview: 'Live rendered preview',
    previewLabel: 'Status card preview',
  },
} as const

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

function StatusCardSettingsSection({ scope, browserLocale }: { scope: SettingsScope<StatusCardSettings>; browserLocale: Locale }) {
  const state = useSyncExternalStore(
    scope.subscribe.bind(scope),
    scope.getSnapshot.bind(scope),
  )
  const settings = state.value ?? defaults
  const locale = browserLocale
  const text = messages[locale]
  const templateOptions = getTemplateOptions(locale)
  const [customDraft, setCustomDraft] = useState(settings.customTemplate)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => setCustomDraft(settings.customTemplate), [settings.customTemplate])
  useEffect(() => {
    if (state.writable && settings.locale !== browserLocale) void scope.set('locale', browserLocale)
  }, [browserLocale, scope, settings.locale, state.writable])

  const set = <K extends keyof StatusCardSettings>(key: K, value: StatusCardSettings[K]) => void scope.set(key, value)
  const title = localizeDefaultTitle(settings.cardTitle.trim() || defaultCardTitle(locale), locale)

  let preview: React.ReactNode
  let previewError = ''
  try {
    const previewSpec = createTemplateSpec(
      settings.template,
      title,
      settings.template === 'custom' ? customDraft : settings.customTemplate,
      locale,
    )
    preview = <StatusCardPreview spec={previewSpec} locale={locale} />
  } catch (error) {
    previewError = error instanceof Error ? error.message : String(error)
    preview = null
  }

  const saveCustomTemplate = async () => {
    try {
      parseCustomTemplate(customDraft, title, locale)
      await scope.set('customTemplate', customDraft)
      setSaveStatus(text.saved)
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <section style={sectionStyle} lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <div>
        <h2 style={{ margin: 0 }}>{text.title}</h2>
        <p style={{ marginBottom: 0 }}>{text.description}</p>
      </div>

      <div style={panelStyle}>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            disabled={!state.writable}
            onChange={event => set('enabled', event.target.checked)}
          />{' '}
          {text.enabled}
        </label>

        <label>
          {text.cardTitle}
          <input
            value={title}
            disabled={!state.writable}
            maxLength={80}
            placeholder={text.titlePlaceholder}
            onChange={event => set('cardTitle', event.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 6 }}
          />
        </label>

        <label>
          {text.template}
          <select
            value={settings.template}
            disabled={!state.writable}
            onChange={event => set('template', event.target.value as TemplateId)}
            style={{ display: 'block', width: '100%', marginTop: 6 }}
          >
            {templateOptions.map(option => (
              <option key={option.id} value={option.id}>{option.label} · {option.description}</option>
            ))}
          </select>
        </label>

        {settings.template === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>
              {text.customJson}
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
                {text.saveCustom}
              </button>
              <span style={{ color: previewError ? 'var(--dsw-alias-color-danger, #d33)' : undefined }}>
                {previewError || saveStatus || text.titleOverride}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <strong>{text.preview}</strong>
        {previewError
          ? <div role="alert" style={{ color: 'var(--dsw-alias-color-danger, #d33)' }}>{previewError}</div>
          : <div aria-label={text.previewLabel}>{preview}</div>}
      </div>
    </section>
  )
}

export const inject = ['slots', 'settingsScope']

export function apply(ctx: ClientContext): void {
  const browserLocale = detectPreferredLocale(globalThis.navigator?.languages, globalThis.navigator?.language)
  const scope = ctx.settingsScope.bind<StatusCardSettings>({
    namespace: 'status-card',
    decode,
  })
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'status-card',
    order: 36,
    label: () => messages[browserLocale].title,
    inject: () => ({ scope, browserLocale }),
  }, StatusCardSettingsSection as never))
}
