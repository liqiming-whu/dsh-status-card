import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outRoot = fileURLToPath(new URL('../docs/images/templates/', import.meta.url))

const themes = {
  a: { bg1: '#fff1f7', bg2: '#f7e8ff', card: '#ffffff', border: '#f1c7dc', ink: '#402838', muted: '#8b657b', accent: '#ec4899', accent2: '#a855f7', badge: '#eafaf1', badgeInk: '#16875b', panel: '#fff7fb' },
  b: { bg1: '#f7f9fc', bg2: '#eaf0f8', card: '#ffffff', border: '#d9e1ec', ink: '#172033', muted: '#6b778c', accent: '#2563eb', accent2: '#38bdf8', badge: '#eefaf3', badgeInk: '#17834f', panel: '#f8fafc' },
  c: { bg1: '#e9eef7', bg2: '#cfd9e8', card: '#f9fbff', border: '#aebed3', ink: '#14213d', muted: '#52637a', accent: '#315e9b', accent2: '#60a5fa', badge: '#e8f7ef', badgeInk: '#17764b', panel: '#edf3fa' },
  d: { bg1: '#090b22', bg2: '#221044', card: '#11152f', border: '#4c3b86', ink: '#f4f1ff', muted: '#aaa3cf', accent: '#8b5cf6', accent2: '#22d3ee', badge: '#2a1e51', badgeInk: '#d8c7ff', panel: '#181d3d' },
  e: { bg1: '#fff5e9', bg2: '#ffe2d0', card: '#fffdf8', border: '#f3c99f', ink: '#55382d', muted: '#967064', accent: '#f59e6b', accent2: '#f8c56b', badge: '#eef9e9', badgeInk: '#4d8b45', panel: '#fff7ed' },
  f: { bg1: '#06110d', bg2: '#0d2620', card: '#0c1714', border: '#275848', ink: '#e6fff5', muted: '#80ad9d', accent: '#10b981', accent2: '#22d3ee', badge: '#11372d', badgeInk: '#78f2bf', panel: '#10211c' },
}

const cards = {
  zh: [
    { id: 'a', name: 'A · 软萌活力', title: '🌸 AI 状态', stats: [['Mood', '😊 开心'], ['Status', '🐾 陪伴中'], ['Energy', '⚡ 120%']], badge: '🌟 超可爱模式', progressLabel: '可爱度', progress: 100, footer: '正在给主人准备惊喜喵~' },
    { id: 'b', name: 'B · 极简专注', title: '🧭 专注模式', stats: [['状态', '🟢 就绪'], ['任务', '🎯 处理中'], ['能量', '⚡ 高能']], badge: '✓ 低干扰模式', progressLabel: '当前任务', progress: 68, footer: '正在专注处理你的请求。' },
    { id: 'c', name: 'C · 专业工作', title: '🧠 Agent 控制台', stats: [['模式', '🔍 分析'], ['阶段', '🛠️ 执行'], ['负载', '⚡ 82%']], badge: '✅ 状态正常', progressLabel: '任务进度', progress: 72, footer: '正在核对细节并生成可靠结果。' },
    { id: 'd', name: 'D · 星舰科技', title: '🚀 神经甲板', stats: [['核心', '🟣 在线'], ['任务', '🛰️ 编排中'], ['功率', '⚡ 96%']], badge: '🌌 深度思考', progressLabel: '推理链路', progress: 88, footer: '信号稳定，正在构建最佳答复。' },
    { id: 'e', name: 'E · 温暖陪伴', title: '☕ 暖心小站', stats: [['心情', '🥰 温柔'], ['陪伴', '🫶 进行中'], ['温度', '🌤️ 98%']], badge: '🍀 安心陪伴模式', progressLabel: '默契度', progress: 94, footer: '慢慢来，我会陪你一起把事情做好。' },
    { id: 'f', name: 'F · 开发者终端', title: '💻 开发运行时', stats: [['构建', '🟢 就绪'], ['任务', '🧩 编码中'], ['CPU', '⚡ 87%']], badge: '🛠️ 工程模式', progressLabel: '实现进度', progress: 76, footer: '正在分析代码、验证改动并准备交付。' },
  ],
  en: [
    { id: 'a', name: 'A · Soft Vitality', title: '🌸 AI Status', stats: [['Mood', '😊 Happy'], ['Status', '🐾 By your side'], ['Energy', '⚡ 120%']], badge: '🌟 Super Cute Mode', progressLabel: 'Cuteness', progress: 100, footer: 'Preparing a delightful surprise for you~' },
    { id: 'b', name: 'B · Minimal Focus', title: '🧭 Focus', stats: [['Status', '🟢 Ready'], ['Task', '🎯 Processing'], ['Energy', '⚡ High']], badge: '✓ Low Distraction', progressLabel: 'Current task', progress: 68, footer: 'Focusing fully on your request.' },
    { id: 'c', name: 'C · Professional Work', title: '🧠 Agent Console', stats: [['Mode', '🔍 Analysis'], ['Stage', '🛠️ Execute'], ['Load', '⚡ 82%']], badge: '✅ All Systems Normal', progressLabel: 'Task progress', progress: 72, footer: 'Checking details and preparing a reliable result.' },
    { id: 'd', name: 'D · Neural Deck', title: '🚀 Neural Deck', stats: [['Core', '🟣 Online'], ['Mission', '🛰️ Orchestrating'], ['Power', '⚡ 96%']], badge: '🌌 Deep Thinking', progressLabel: 'Reasoning path', progress: 88, footer: 'Signal stable. Constructing the best response.' },
    { id: 'e', name: 'E · Warm Companion', title: '☕ Cozy Corner', stats: [['Mood', '🥰 Gentle'], ['Company', '🫶 Present'], ['Warmth', '🌤️ 98%']], badge: '🍀 Caring Companion', progressLabel: 'Rapport', progress: 94, footer: "Take your time — we'll get this done together." },
    { id: 'f', name: 'F · Developer Runtime', title: '💻 Dev Runtime', stats: [['Build', '🟢 Ready'], ['Task', '🧩 Coding'], ['CPU', '⚡ 87%']], badge: '🛠️ Engineering Mode', progressLabel: 'Implementation', progress: 76, footer: 'Analyzing code, verifying changes, and preparing delivery.' },
  ],
}

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function render(card, lang) {
  const t = themes[card.id]
  const dark = card.id === 'd' || card.id === 'f'
  const statXs = [92, 422, 752]
  const stats = card.stats.map(([label, value], i) => `
    <rect x="${statXs[i]}" y="205" width="296" height="90" rx="16" fill="${t.panel}" stroke="${t.border}"/>
    <text x="${statXs[i] + 20}" y="234" class="label">${esc(label)}</text>
    <text x="${statXs[i] + 20}" y="272" class="value">${esc(value)}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520" role="img" aria-labelledby="title desc">
  <title id="title">${esc(card.name)}</title>
  <desc id="desc">${lang === 'zh' ? 'dsh-status-card 中文模板展示图' : 'dsh-status-card English template preview'}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>
    <filter id="shadow" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${dark ? '#000000' : '#6b7280'}" flood-opacity=".18"/></filter>
  </defs>
  <style>
    text { font-family: Inter, "Segoe UI", "Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI Emoji", sans-serif; fill: ${t.ink}; }
    .eyebrow { font-size: 20px; font-weight: 700; letter-spacing: .6px; }
    .title { font-size: 30px; font-weight: 760; }
    .label { font-size: 17px; font-weight: 600; fill: ${t.muted}; }
    .value { font-size: 24px; font-weight: 720; }
    .badge { font-size: 18px; font-weight: 700; fill: ${t.badgeInk}; }
    .progress { font-size: 17px; font-weight: 650; }
    .footer { font-size: 18px; font-weight: 520; fill: ${t.muted}; }
  </style>
  <rect width="1200" height="520" rx="28" fill="url(#bg)"/>
  <circle cx="1090" cy="46" r="120" fill="${t.accent}" opacity=".08"/>
  <circle cx="110" cy="505" r="150" fill="${t.accent2}" opacity=".07"/>
  <text x="60" y="60" class="eyebrow">${esc(card.name)}</text>
  <rect x="58" y="88" width="1084" height="378" rx="25" fill="${t.card}" stroke="${t.border}" stroke-width="2" filter="url(#shadow)"/>
  <text x="92" y="151" class="title">${esc(card.title)}</text>
  <rect x="800" y="119" width="300" height="42" rx="21" fill="${t.badge}"/>
  <text x="950" y="146" class="badge" text-anchor="middle">${esc(card.badge)}</text>
  ${stats}
  <text x="92" y="337" class="progress">${esc(card.progressLabel)}</text>
  <text x="1090" y="337" class="progress" text-anchor="end">${card.progress}%</text>
  <rect x="92" y="354" width="998" height="14" rx="7" fill="${t.border}" opacity=".55"/>
  <rect x="92" y="354" width="${Math.round(998 * card.progress / 100)}" height="14" rx="7" fill="url(#bar)"/>
  <text x="600" y="417" class="footer" text-anchor="middle">${esc(card.footer)}</text>
</svg>`
}

for (const [lang, entries] of Object.entries(cards)) {
  const dir = join(outRoot, lang)
  await mkdir(dir, { recursive: true })
  for (const card of entries) {
    await writeFile(join(dir, `template-${card.id}.svg`), render(card, lang), 'utf8')
  }
}

console.log('Generated 12 bilingual template images in docs/images/templates/')
