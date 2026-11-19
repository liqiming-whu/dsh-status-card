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

const textTone: Record<string, string> = { success: '#22a06b', danger: '#dc2626', warning: '#d97706', info: '#2563eb' }

/** Strip the inline rich-text markers GenUI renders (**bold**, ==mark==, `code`). */
function plain(value: unknown): string {
  return text(value).replace(/\*\*(.+?)\*\*/g, '$1').replace(/==(.+?)==/g, '$1').replace(/`([^`]+)`/g, '$1')
}

function Spark({ values }: { values: unknown }) {
  if (!Array.isArray(values)) return null
  const nums = values.map(Number).filter(Number.isFinite)
  if (nums.length < 2) return null
  const min = Math.min(...nums), max = Math.max(...nums), span = max - min || 1
  const points = nums.map((v, i) => `${(i / (nums.length - 1)) * 100},${22 - ((v - min) / span) * 20}`).join(' ')
  return <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden style={{ display: 'block', marginTop: 4 }}><polyline points={points} fill="none" stroke="var(--dsw-alias-color-primary, #6d5dfc)" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
}

function PreviewNode({ value, locale, depth = 0 }: { value: unknown; locale: Locale; depth?: number }) {
  const node = record(value)
  if (node === null || depth > 8) return null
  const type = text(node.type)
  const children = Array.isArray(node.items)
    ? node.items.map((item, index) => <PreviewNode key={index} value={item} locale={locale} depth={depth + 1} />)
    : null

  if (type === 'card') {
    const accent = typeof node.accent === 'string' && /^#[0-9a-f]{3,8}$/i.test(node.accent) ? node.accent : ''
    const style: React.CSSProperties = node.flat
      ? { ...surface, background: 'rgba(127,127,127,.06)' }
      : accent ? { ...surface, borderColor: `${accent}66`, background: `linear-gradient(180deg, ${accent}12, transparent 70%)` } : surface
    return <div style={style}>
      {node.eyebrow ? <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '.04em', opacity: .7, color: accent || undefined }}>{text(node.eyebrow)}</div> : null}
      {node.title ? <strong style={{ fontSize: 16, color: accent || undefined }}>{text(node.title)}</strong> : null}
      {children}
    </div>
  }
  // GenUI's `row` is a fixed 12px flex row (--dsl-g-gap-md) and its renderer
  // never reads `node.gap`, so the preview must not honour one either.
  if (type === 'row') return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: node.spacer || node.justify === 'between' ? 'space-between' : node.justify === 'center' ? 'center' : undefined }}>{children}</div>
  if (type === 'col') return <div style={{ display: 'flex', flexDirection: 'column', gap: Number(node.gap) || 12 }}>{children}</div>
  if (type === 'grid') return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Number(node.cols) || 2)}, minmax(0, 1fr))`, gap: 12 }}>{children}</div>
  if (type === 'stat') {
    const delta = text(node.delta)
    const deltaColor = delta.startsWith('+') ? '#22a06b' : delta.startsWith('-') ? '#dc2626' : undefined
    return <div style={{ minWidth: 0 }}>
      <div style={{ opacity: .65, fontSize: 12 }}>{text(node.label)}</div>
      <strong style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{text(node.value)}</strong>
      {delta ? <div style={{ fontSize: 12, color: deltaColor }}>{delta}</div> : null}
      <Spark values={node.spark} />
    </div>
  }
  if (type === 'badge') return <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', width: 'fit-content', padding: '4px 9px', borderRadius: 999, fontSize: 12, ...badgeTone[text(node.tone)] }}>{node.icon ? <span aria-hidden>{text(node.icon)}</span> : null}{text(node.label)}</span>
  if (type === 'progress') {
    const valueNumber = Math.max(0, Math.min(100, Number(node.value) || 0))
    const valueText = text(node.valueLabel) || `${valueNumber}%`
    if (node.variant === 'ring') {
      const r = 26, c = 2 * Math.PI * r
      return <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden>
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(127,127,127,.2)" strokeWidth="7" />
          <circle cx="34" cy="34" r={r} fill="none" stroke="var(--dsw-alias-color-primary, #6d5dfc)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * valueNumber / 100} ${c}`} transform="rotate(-90 34 34)" />
          <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{valueText}</text>
        </svg>
        <span style={{ fontSize: 13 }}>{text(node.label)}</span>
      </div>
    }
    const target = Number(node.target)
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{text(node.label)}</span><span>{valueText}</span></div><div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(127,127,127,.2)', overflow: 'hidden' }}><div style={{ width: `${valueNumber}%`, height: '100%', borderRadius: 999, background: 'var(--dsw-alias-color-primary, #6d5dfc)' }} />{target > 0 && target < 100 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target}%`, width: 2, background: 'currentColor', opacity: .5 }} /> : null}</div></div>
  }
  if (type === 'text') {
    const size = text(node.size)
    const align = node.align === 'center' || node.align === 'right' || node.align === 'left' ? node.align : node.center ? 'center' : undefined
    const fontSize = size === 'caption' ? 12 : size === 'h3' ? 15 : size === 'h2' ? 18 : 14
    return <div style={{ opacity: size === 'muted' || size === 'caption' || node.tone === 'muted' ? .7 : 1, fontSize, fontWeight: size.startsWith('h') ? 650 : undefined, textAlign: align, color: textTone[text(node.tone)], fontFamily: node.mono ? 'ui-monospace, monospace' : undefined }}>{plain(node.content)}</div>
  }
  if (type === 'divider') return <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--dsw-alias-border-l2, #ccc)' }} />
  if (type === 'spacer') return <div style={{ height: 8 }} />
  if (type === 'list' && Array.isArray(node.items)) return <ul>{node.items.map((item, index) => <li key={index}>{text(record(item)?.title ?? item)}</li>)}</ul>
  if (type === 'keyvalue' && Array.isArray(node.pairs)) return <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>{node.pairs.map((pair, index) => { const p = record(pair); return <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}><dt style={{ opacity: .65 }}>{text(p?.key)}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{plain(p?.value)}</dd></div> })}</dl>
  return <div style={{ opacity: .65, fontSize: 12 }}>{locale === 'zh' ? '预览暂不支持组件' : 'Preview does not support component'}：{type || 'unknown'}</div>
}

export function StatusCardPreview({ spec, locale }: { spec: GenuiSpec; locale: Locale }) {
  // GenUI reads the spec-level gap as `spec.gap ?? 16`; mirror that default.
  return <div style={{ display: 'flex', flexDirection: 'column', gap: spec.gap ?? 16 }}>{spec.title ? <strong>{spec.title}</strong> : null}{spec.items.map((item, index) => <PreviewNode key={index} value={item} locale={locale} />)}</div>
}
