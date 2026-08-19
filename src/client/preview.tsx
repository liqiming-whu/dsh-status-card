import React from 'react'
import type { GenuiSpec, Locale } from '../templates.ts'

const surface: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  border: '1px solid var(--dsw-alias-border-l2, #ccc)',
  borderRadius: 12,
  background: 'var(--dsw-alias-background-elevated, transparent)',
}

const badgeTone: Record<string, React.CSSProperties> = {
  success: { color: '#22a06b', background: 'rgba(34,160,107,.12)' },
  accent: { color: '#7c5cff', background: 'rgba(124,92,255,.12)' },
  warn: { color: '#d97706', background: 'rgba(217,119,6,.12)' },
  danger: { color: '#dc2626', background: 'rgba(220,38,38,.12)' },
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function PreviewNode({ value, locale, depth = 0 }: { value: unknown; locale: Locale; depth?: number }) {
  const node = record(value)
  if (node === null || depth > 8) return null
  const type = text(node.type)
  const children = Array.isArray(node.items)
    ? node.items.map((item, index) => <PreviewNode key={index} value={item} locale={locale} depth={depth + 1} />)
    : null

  if (type === 'card') return <div style={surface}>{node.title ? <strong>{text(node.title)}</strong> : null}{children}</div>
  if (type === 'row') return <div style={{ display: 'flex', gap: Number(node.gap) || 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
  if (type === 'col') return <div style={{ display: 'flex', flexDirection: 'column', gap: Number(node.gap) || 8 }}>{children}</div>
  if (type === 'grid') return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Number(node.cols) || 2)}, minmax(0, 1fr))`, gap: 8 }}>{children}</div>
  if (type === 'stat') return <div style={{ minWidth: 110, flex: '1 1 110px' }}><div style={{ opacity: .65, fontSize: 12 }}>{text(node.label)}</div><strong style={{ fontSize: 18 }}>{text(node.value)}</strong>{node.delta ? <div style={{ fontSize: 12 }}>{text(node.delta)}</div> : null}</div>
  if (type === 'badge') return <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', width: 'fit-content', padding: '4px 9px', borderRadius: 999, fontSize: 12, ...badgeTone[text(node.tone)] }}>{node.icon ? <span aria-hidden>{text(node.icon)}</span> : null}{text(node.label)}</span>
  if (type === 'progress') {
    const valueNumber = Math.max(0, Math.min(100, Number(node.value) || 0))
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{text(node.label)}</span><span>{text(node.valueLabel) || `${valueNumber}%`}</span></div><div style={{ height: 8, borderRadius: 999, background: 'rgba(127,127,127,.2)', overflow: 'hidden' }}><div style={{ width: `${valueNumber}%`, height: '100%', borderRadius: 999, background: 'var(--dsw-alias-color-primary, #6d5dfc)' }} /></div></div>
  }
  if (type === 'text') return <div style={{ opacity: node.size === 'muted' || node.size === 'caption' ? .7 : 1, fontSize: node.size === 'caption' ? 12 : 14, textAlign: node.center ? 'center' : undefined }}>{text(node.content)}</div>
  if (type === 'divider') return <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--dsw-alias-border-l2, #ccc)' }} />
  if (type === 'spacer') return <div style={{ height: 8 }} />
  if (type === 'list' && Array.isArray(node.items)) return <ul>{node.items.map((item, index) => <li key={index}>{text(record(item)?.title ?? item)}</li>)}</ul>
  if (type === 'keyvalue' && Array.isArray(node.pairs)) return <dl>{node.pairs.map((pair, index) => { const p = record(pair); return <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><dt>{text(p?.key)}</dt><dd>{text(p?.value)}</dd></div> })}</dl>
  return <div style={{ opacity: .65, fontSize: 12 }}>{locale === 'zh' ? '预览暂不支持组件' : 'Preview does not support component'}：{type || 'unknown'}</div>
}

export function StatusCardPreview({ spec, locale }: { spec: GenuiSpec; locale: Locale }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: spec.gap ?? 10 }}>{spec.title ? <strong>{spec.title}</strong> : null}{spec.items.map((item, index) => <PreviewNode key={index} value={item} locale={locale} />)}</div>
}
