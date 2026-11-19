// Renders docs/images/templates/** straight from the built templates
// (lib/index.js), so the README images can never drift from the presets.
// Run `pnpm run build` first. This is a small static SVG layout of the GenUI
// subset the presets use, not GenUI itself; real cards follow the host theme.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTemplateSpec, getTemplateOptions } from '../lib/index.js'

const outRoot = fileURLToPath(new URL('../docs/images/templates/', import.meta.url))
const IDS = ['a', 'b', 'c', 'd', 'e', 'f']

// Canvas mood per preset; the card accent itself comes from the template.
const themes = {
  a: { bg1: '#fff1f7', bg2: '#f7e8ff', card: '#ffffff', ink: '#402838', muted: '#8b657b', track: '#f6dbe8' },
  b: { bg1: '#f7f9fc', bg2: '#eaf0f8', card: '#f8fafc', ink: '#172033', muted: '#6b778c', track: '#dfe6f0' },
  c: { bg1: '#e9eef7', bg2: '#cfd9e8', card: '#f9fbff', ink: '#14213d', muted: '#52637a', track: '#d6e0ec' },
  d: { bg1: '#090b22', bg2: '#221044', card: '#11152f', ink: '#f4f1ff', muted: '#aaa3cf', track: '#2a2f55' },
  e: { bg1: '#fff5e9', bg2: '#ffe2d0', card: '#fffdf8', ink: '#55382d', muted: '#967064', track: '#f6e2c8' },
  f: { bg1: '#06110d', bg2: '#0d2620', card: '#0c1714', ink: '#e6fff5', muted: '#80ad9d', track: '#1d3a31' },
}
const BADGE = { success: '#16a34a', accent: '#7c5cff', warn: '#d97706', danger: '#dc2626' }
const TONE = { success: '#16a34a', danger: '#dc2626', warning: '#d97706', info: '#2563eb' }
const FONT = 'Inter, &quot;Segoe UI&quot;, &quot;Microsoft YaHei&quot;, &quot;Noto Sans CJK SC&quot;, &quot;Segoe UI Emoji&quot;, sans-serif'
const MONO = 'ui-monospace, Consolas, &quot;Cascadia Mono&quot;, monospace'

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const plain = value => String(value ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/==(.+?)==/g, '$1').replace(/`([^`]+)`/g, '$1')
// Rough advance width: CJK/emoji ≈ 1em, latin ≈ .58em.
const measure = (s, size) => [...String(s)].reduce((w, ch) => w + (ch.codePointAt(0) > 0x2e80 ? size : size * 0.58), 0)
const T = (x, y, s, size, fill, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`

function layout(node, x, y, w, ctx) {
  const { t, accent } = ctx
  switch (node.type) {
    case 'grid': {
      const gap = 16, cw = (w - gap * (node.cols - 1)) / node.cols
      let h = 0; const parts = []
      node.items.forEach((child, i) => { const r = layout(child, x + i * (cw + gap), y, cw, ctx); parts.push(r.svg); h = Math.max(h, r.h) })
      return { svg: parts.join(''), h }
    }
    case 'col': {
      let cy = y; const parts = []
      for (const child of node.items) { const r = layout(child, x, cy, w, ctx); parts.push(r.svg); cy += r.h + (node.gap ?? 12) }
      return { svg: parts.join(''), h: cy - y - (node.gap ?? 12) }
    }
    case 'row': {
      const rs = node.items.map(child => ({ child, r: layout(child, 0, 0, w, { ...ctx, measureOnly: true }) }))
      const h = Math.max(...rs.map(item => item.r.h)); const parts = []
      if (node.spacer && rs.length >= 2) {
        parts.push(layout(rs[0].child, x, y + (h - rs[0].r.h) / 2, w, ctx).svg)
        const last = rs.at(-1); parts.push(layout(last.child, x + w - last.r.w, y + (h - last.r.h) / 2, last.r.w, ctx).svg)
      } else {
        let cx = x; for (const item of rs) { parts.push(layout(item.child, cx, y + (h - item.r.h) / 2, item.r.w, ctx).svg); cx += item.r.w + 12 }
      }
      return { svg: parts.join(''), h }
    }
    case 'stat': {
      const delta = node.delta ? String(node.delta) : ''
      const dc = delta.startsWith('+') ? '#16a34a' : delta.startsWith('-') ? '#dc2626' : t.muted
      let svg = `<rect x="${x}" y="${y}" width="${w}" height="${node.spark ? 138 : 112}" rx="14" fill="${accent}" fill-opacity=".07"/>`
      svg += T(x + 18, y + 30, node.label, 16, t.muted, 'font-weight="600"')
      svg += T(x + 18, y + 70, node.value, 34, t.ink, 'font-weight="760"')
      if (delta) svg += T(x + 18, y + 96, delta, 15, dc, 'font-weight="600"')
      if (Array.isArray(node.spark)) {
        const v = node.spark, min = Math.min(...v), span = Math.max(...v) - min || 1
        const pts = v.map((n, i) => `${x + 18 + i * (w - 36) / (v.length - 1)},${y + 128 - (n - min) / span * 18}`).join(' ')
        svg += `<polyline points="${pts}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
      }
      return { svg, h: node.spark ? 138 : 112 }
    }
    case 'progress': {
      const value = Math.max(0, Math.min(100, node.value)), label = node.valueLabel ?? `${value}%`
      if (node.variant === 'ring') {
        const r = 52, c = 2 * Math.PI * r, cx = x + 70, cy = y + 70
        let svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.track}" stroke-width="13"/>`
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${(c * value / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
        svg += T(cx, cy + 9, label, 26, t.ink, 'font-weight="760" text-anchor="middle"')
        svg += T(x + 150, cy + 7, node.label, 19, t.ink, 'font-weight="650"')
        return { svg, h: 140 }
      }
      let svg = T(x, y + 18, node.label, 17, t.ink, 'font-weight="650"') + T(x + w, y + 18, label, 17, t.ink, 'font-weight="700" text-anchor="end"')
      svg += `<rect x="${x}" y="${y + 32}" width="${w}" height="12" rx="6" fill="${t.track}"/>`
      svg += `<rect x="${x}" y="${y + 32}" width="${(w * value / 100).toFixed(1)}" height="12" rx="6" fill="${accent}"/>`
      if (node.target > 0 && node.target < 100) svg += `<rect x="${(x + w * node.target / 100 - 1).toFixed(1)}" y="${y + 28}" width="2.5" height="20" rx="1" fill="${t.ink}" opacity=".45"/>`
      return { svg, h: 46 }
    }
    case 'keyvalue': {
      let svg = ''
      node.pairs.forEach((pair, i) => {
        const yy = y + 26 + i * 44
        svg += T(x, yy, pair.key, 18, t.muted, 'font-weight="600"') + T(x + w, yy, plain(pair.value), 20, t.ink, 'font-weight="700" text-anchor="end"')
        if (i < node.pairs.length - 1) svg += `<rect x="${x}" y="${yy + 15}" width="${w}" height="1" fill="${t.track}"/>`
      })
      return { svg, h: node.pairs.length * 44 - 8 }
    }
    case 'badge': {
      const s = `${node.icon ? node.icon + ' ' : ''}${node.label}`, bw = measure(s, 17) + 32, color = BADGE[node.tone] ?? accent
      if (ctx.measureOnly) return { svg: '', h: 38, w: bw }
      return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="38" rx="19" fill="${color}" fill-opacity=".14"/>` + T(x + 16, y + 25, s, 17, color, 'font-weight="700"'), h: 38, w: bw }
    }
    case 'text': {
      const size = { caption: 16, muted: 16, h3: 22, h2: 26 }[node.size] ?? 18
      const fill = TONE[node.tone] ?? (node.tone === 'muted' || node.size === 'muted' || node.size === 'caption' ? t.muted : t.ink)
      const s = plain(node.content), tw = measure(s, size)
      if (ctx.measureOnly) return { svg: '', h: size + 8, w: tw }
      const anchor = node.align === 'center' ? `x="${x + w / 2}" text-anchor="middle"` : `x="${x}"`
      const family = node.mono ? MONO : FONT
      return { svg: `<text ${anchor} y="${y + size}" font-size="${size}" fill="${fill}" font-family="${family}" font-weight="${node.size?.startsWith('h') ? 720 : 520}">${esc(s)}</text>`, h: size + 8, w: tw }
    }
    case 'divider': return { svg: `<rect x="${x}" y="${y + 6}" width="${w}" height="1.5" fill="${t.track}"/>`, h: 12 }
    default: return { svg: '', h: 0 }
  }
}

function render(id, lang) {
  const t = themes[id]
  const dark = id === 'd' || id === 'f'
  const option = getTemplateOptions(lang).find(item => item.id === id)
  const spec = createTemplateSpec(id, lang === 'zh' ? 'AI 状态' : 'AI Status', undefined, lang)
  const card = spec.items[0]
  const accent = card.flat ? '#2563eb' : card.accent ?? '#6366f1'
  const ctx = { t, accent }
  const X = 92, W = 1016
  let y = 120; let body = ''
  if (card.eyebrow) { body += T(X, y + 4, card.eyebrow, 16, accent, 'font-weight="700" letter-spacing="1.2"'); y += 24 }
  body += T(X, y + 28, card.title, 30, card.flat ? t.ink : accent, 'font-weight="760"'); y += 52
  for (const node of card.items) { const r = layout(node, X, y, W, ctx); body += r.svg; y += r.h + 20 }
  const cardH = y - 88 + 12, H = cardH + 140
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${H}" viewBox="0 0 1200 ${H}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(option.label)}</title>
  <desc id="desc">${lang === 'zh' ? 'dsh-status-card 中文模板展示图' : 'dsh-status-card English template preview'}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
    <linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${accent}" stop-opacity="${card.flat ? 0 : 0.10}"/><stop offset=".55" stop-color="${accent}" stop-opacity="0"/></linearGradient>
    <filter id="shadow" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${dark ? '#000000' : '#6b7280'}" flood-opacity="${card.flat ? 0.08 : 0.18}"/></filter>
  </defs>
  <style>text { font-family: ${FONT.replaceAll('&quot;', '"')}; }</style>
  <rect width="1200" height="${H}" rx="28" fill="url(#bg)"/>
  <circle cx="1090" cy="46" r="120" fill="${accent}" opacity=".08"/>
  <circle cx="110" cy="${H - 15}" r="150" fill="${accent}" opacity=".06"/>
  ${T(60, 60, `${option.label} · ${option.description}`, 20, t.ink, 'font-weight="700" letter-spacing=".4"')}
  <rect x="58" y="88" width="1084" height="${cardH}" rx="25" fill="${t.card}" stroke="${accent}" stroke-opacity="${card.flat ? 0.15 : 0.45}" stroke-width="2" filter="url(#shadow)"/>
  <rect x="58" y="88" width="1084" height="${cardH}" rx="25" fill="url(#wash)"/>
  ${body}
</svg>`
}

function scopedBody(svg, prefix) {
  const height = Number(svg.match(/height="(\d+)"/)[1])
  const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return { height, body: body.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`).replaceAll('url(#', `url(#${prefix}-`).replace(/[ \t]+$/gm, '') }
}

function renderBilingual(id) {
  const zh = scopedBody(render(id, 'zh'), 'zh')
  const en = scopedBody(render(id, 'en'), 'en')
  const H = Math.max(zh.height, en.height) + 120
  const option = getTemplateOptions('zh').find(item => item.id === id)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2460" height="${H}" viewBox="0 0 2460 ${H}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(option.label)} · 中文与 English</title>
  <desc id="desc">dsh-status-card bilingual template preview</desc>
  <rect width="2460" height="${H}" rx="32" fill="#eef2f7"/>
  <text x="40" y="38" font-family="Inter, Segoe UI, sans-serif" font-size="20" font-weight="700" fill="#52637a">中文 / English</text>
  <svg x="20" y="70" width="1200" height="${zh.height}" viewBox="0 0 1200 ${zh.height}">${zh.body}</svg>
  <svg x="1240" y="70" width="1200" height="${en.height}" viewBox="0 0 1200 ${en.height}">${en.body}</svg>
</svg>`
}

for (const lang of ['zh', 'en']) {
  const dir = join(outRoot, lang)
  await mkdir(dir, { recursive: true })
  for (const id of IDS) await writeFile(join(dir, `template-${id}.svg`), render(id, lang), 'utf8')
}
const bilingualDir = join(outRoot, 'bilingual')
await mkdir(bilingualDir, { recursive: true })
for (const id of IDS) await writeFile(join(bilingualDir, `template-${id}.svg`), renderBilingual(id), 'utf8')

console.log('Generated 12 localized and 6 bilingual template images in docs/images/templates/')
