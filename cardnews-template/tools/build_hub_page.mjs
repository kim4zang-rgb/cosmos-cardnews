#!/usr/bin/env node
// Builds the "hub" page: one bookmarkable link listing every card-news
// set's review page for a given day. Read a JSON manifest (array of
// {id, subject, title, emoji, url}), write the hub HTML.
//
// Usage:
//   node tools/build_hub_page.mjs --manifest review/manifest-2026-08-31.json \
//     --date "2026-08-31" --out review/index.html

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

function arg(name){ const i = process.argv.indexOf('--' + name); return i === -1 ? undefined : process.argv[i + 1] }
function fail(msg){ console.error('build-hub-page: ' + msg); process.exit(1) }

const manifestPath = arg('manifest')
const date = arg('date')
const out = arg('out')
if(!manifestPath || !date || !out) fail('need --manifest, --date, --out')
if(!existsSync(manifestPath)) fail(manifestPath + ' does not exist')

const items = JSON.parse(readFileSync(manifestPath, 'utf8'))
if(!Array.isArray(items) || !items.length) fail('manifest must be a non-empty JSON array')

function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) }

const rows = items.map(it => `
    <a class="row" href="${esc(it.url)}" target="_blank" rel="noopener">
      <span class="num">${String(it.id).padStart(2, '0')}</span>
      <span class="emoji">${esc(it.emoji)}</span>
      <span class="text">
        <span class="subject">${esc(it.subject)}</span>
        <span class="title">${esc(it.title)}</span>
      </span>
      <span class="arrow">→</span>
    </a>`).join('\n')

const html = `<meta charset="utf-8">
<title>카드뉴스 생성기</title>
<style>
  :root {
    --bg: #dedad5; --surface: #fffefc; --surface-alt: #f4f3f1;
    --ink: #111010; --muted: #57534e; --faint: #8a8580;
    --border: #e3e0dc; --border-strong: #cfcac4; --accent: #c96f4a;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #171513; --surface: #211e1c; --surface-alt: #262320;
      --ink: #f5f3f0; --muted: #b8b2ab; --faint: #85807a;
      --border: #35312d; --border-strong: #454039; --accent: #e08a63;
    }
  }
  :root[data-theme="dark"] {
    --bg: #171513; --surface: #211e1c; --surface-alt: #262320;
    --ink: #f5f3f0; --muted: #b8b2ab; --faint: #85807a;
    --border: #35312d; --border-strong: #454039; --accent: #e08a63;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font-family: 'Noto Sans KR', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .wrap { max-width: 460px; margin: 0 auto; padding: 28px 18px 48px; }
  .wordmark {
    display: inline-flex; align-items: baseline;
    font-family: 'Syne', sans-serif; font-weight: 800; letter-spacing: -0.02em;
    font-size: 22px; color: var(--ink);
  }
  .wordmark .dot {
    display: inline-block; width: 0.28em; height: 0.28em; margin-left: 0.06em;
    border-radius: 50%; background: var(--ink); transform: translateY(0.05em);
  }
  .meta {
    margin-top: 3px; font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    letter-spacing: 0.06em; color: var(--faint); text-transform: uppercase;
  }
  h1 {
    font-family: 'Syne', 'Noto Sans KR', sans-serif; font-weight: 800;
    font-size: 27px; line-height: 1.25; letter-spacing: -0.01em;
    margin: 10px 0 26px; text-wrap: balance;
  }
  .list {
    display: flex; flex-direction: column; gap: 10px;
  }
  .row {
    display: flex; align-items: center; gap: 12px;
    padding: 15px 14px; border-radius: 12px;
    background: var(--surface); border: 1px solid var(--border);
    text-decoration: none; color: var(--ink);
  }
  .row:active { background: var(--surface-alt); }
  .num {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--faint);
    width: 20px; flex-shrink: 0;
  }
  .emoji { font-size: 22px; flex-shrink: 0; width: 28px; text-align: center; }
  .text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .subject {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.05em;
    color: var(--faint); text-transform: uppercase;
  }
  .title {
    font-size: 15px; font-weight: 700; line-height: 1.35;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .arrow { color: var(--faint); font-size: 15px; flex-shrink: 0; }
  .footnote {
    margin-top: 28px; font-size: 12.5px; line-height: 1.6; color: var(--faint);
  }
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;700;800&display=swap">

<div class="wrap">
  <span class="wordmark">cosmos<span class="dot"></span></span>
  <div class="meta">${esc(date)} · ${items.length}개 주제</div>
  <h1>오늘의 카드뉴스</h1>
  <div class="list">${rows}
  </div>
  <div class="footnote">주제를 탭하면 리뷰 화면이 열려요. 거기서 이미지를 저장하고 캡션을 복사한 뒤, 인스타그램 앱에서 업로드하면 됩니다.</div>
</div>
`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html, 'utf8')
console.log('wrote ' + out + ' (' + items.length + ' items, ' + Math.round(html.length / 1024) + ' KB)')
