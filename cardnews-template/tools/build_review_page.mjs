#!/usr/bin/env node
// Builds a mobile review page for one finished card-news set: the 6 slide
// images (embedded, tap-to-zoom) + caption (tap-to-copy) + a "save all
// images" button that uses the Artifact downloads capability. Publish the
// output file as an Artifact with capabilities: {downloads: true}.
//
// Usage:
//   node tools/build_review_page.mjs --dir output/2026-08-31-economy \
//     --title "SK온 배터리" --date "2026-08-31" --out review/2026-08-31-economy.html

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

function arg(name){ const i = process.argv.indexOf('--' + name); return i === -1 ? undefined : process.argv[i + 1] }
function fail(msg){ console.error('build-review-page: ' + msg); process.exit(1) }

const dir = arg('dir')
const title = arg('title')
const date = arg('date')
const out = arg('out')
if(!dir || !title || !date || !out) fail('need --dir, --title, --date, --out')
if(!existsSync(dir)) fail(dir + ' does not exist')

const pngFiles = readdirSync(dir).filter(f => /^\d+\.png$/.test(f)).sort()
if(!pngFiles.length) fail('no NN.png files found in ' + dir)

const slides = pngFiles.map(f => ({
  filename: f,
  dataUri: 'data:image/png;base64,' + readFileSync(join(dir, f)).toString('base64'),
}))

const captionPath = join(dir, 'caption.txt')
const caption = existsSync(captionPath) ? readFileSync(captionPath, 'utf8') : ''

function esc(s){ return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) }
function jsStr(s){ return JSON.stringify(s) }

const html = `<meta charset="utf-8">
<title>${esc(title)} 리뷰</title>
<style>
  :root {
    --bg: #dedad5;
    --surface: #fffefc;
    --surface-alt: #f4f3f1;
    --ink: #111010;
    --muted: #57534e;
    --faint: #8a8580;
    --border: #e3e0dc;
    --border-strong: #cfcac4;
    --accent: #c96f4a;
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
    background: var(--bg);
    color: var(--ink);
    font-family: 'Noto Sans KR', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .wrap { max-width: 460px; margin: 0 auto; padding: 0 20px 64px; }
  header {
    position: sticky; top: 0; z-index: 5;
    background: var(--bg);
    padding: 20px 20px 14px;
    margin: 0 -20px 4px;
    border-bottom: 1px solid var(--border);
  }
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
    margin-top: 2px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em;
    color: var(--faint); text-transform: uppercase;
  }
  h1 {
    font-family: 'Syne', 'Noto Sans KR', sans-serif; font-weight: 800;
    font-size: 26px; line-height: 1.25; letter-spacing: -0.01em;
    margin: 10px 0 0; text-wrap: balance;
  }
  .section-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
    color: var(--faint); text-transform: uppercase; margin: 28px 0 12px;
  }
  .filmstrip { display: flex; flex-direction: column; gap: 10px; }
  .slide {
    position: relative; border-radius: 10px; overflow: hidden;
    border: 1px solid var(--border); background: var(--surface-alt);
    aspect-ratio: 1080 / 1350; cursor: zoom-in;
  }
  .slide img { width: 100%; height: 100%; display: block; object-fit: cover; }
  .slide .idx {
    position: absolute; left: 8px; top: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.06em;
    color: #fffefc; background: rgba(17,16,16,0.55); padding: 3px 7px; border-radius: 4px;
  }

  .save-card {
    margin-top: 24px; padding: 20px; border-radius: 12px;
    background: var(--surface); border: 1px solid var(--border);
  }
  .save-btn {
    width: 100%; padding: 15px 18px; border: none; border-radius: 9px;
    background: var(--ink); color: var(--surface);
    font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 16px;
    cursor: pointer; transition: opacity 0.15s ease;
  }
  .save-btn:disabled { opacity: 0.55; cursor: default; }
  .save-btn:not(:disabled):active { opacity: 0.8; }
  .status-line {
    margin-top: 10px; min-height: 18px;
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.02em;
    color: var(--muted); display: flex; align-items: center; gap: 8px;
  }
  .status-line.ok { color: var(--accent); }
  .progress-track {
    margin-top: 12px; height: 4px; border-radius: 2px; background: var(--border);
    overflow: hidden; display: none;
  }
  .progress-track.show { display: block; }
  .progress-fill { height: 100%; width: 0%; background: var(--accent); transition: width 0.25s ease; }
  .hint {
    margin-top: 10px; font-size: 12.5px; line-height: 1.5; color: var(--faint);
  }

  .caption-card {
    margin-top: 16px; padding: 20px; border-radius: 12px;
    background: var(--surface-alt); border: 1px solid var(--border);
  }
  .caption-head {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  }
  .copy-btn {
    border: 1px solid var(--border-strong); background: var(--surface);
    color: var(--ink); font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    letter-spacing: 0.04em; padding: 7px 12px; border-radius: 7px; cursor: pointer;
  }
  .copy-btn:active { opacity: 0.7; }
  .copy-btn.copied { background: var(--ink); color: var(--surface); border-color: var(--ink); }
  .caption-text {
    font-size: 15px; line-height: 1.7; color: var(--ink);
    white-space: pre-wrap; word-break: keep-all;
  }

  .lightbox {
    position: fixed; inset: 0; background: rgba(10,9,8,0.92);
    display: none; align-items: center; justify-content: center; z-index: 20;
    padding: 24px; cursor: zoom-out;
  }
  .lightbox.open { display: flex; }
  .lightbox img { max-width: 100%; max-height: 100%; border-radius: 6px; }
</style>

<div class="wrap">
  <header>
    <span class="wordmark">cosmos<span class="dot"></span></span>
    <div class="meta">${esc(date)} · REVIEW</div>
    <h1>${esc(title)}</h1>
  </header>

  <div class="section-label">카드 ${slides.length}장</div>
  <div class="filmstrip" id="filmstrip"></div>

  <div class="save-card">
    <button class="save-btn" id="saveAllBtn">이미지 ${slides.length}장 모두 저장</button>
    <div class="status-line" id="statusLine"></div>
    <div class="progress-track" id="progressTrack"><div class="progress-fill" id="progressFill"></div></div>
    <div class="hint">저장 버튼을 누르면 이미지마다 저장 확인 창이 떠요. 하나씩 허용해주세요. 저장 후에는 인스타그램 앱에서 카메라롤의 사진으로 업로드하면 됩니다.</div>
  </div>

  <div class="section-label">캡션</div>
  <div class="caption-card">
    <div class="caption-head">
      <span class="section-label" style="margin:0;">INSTAGRAM CAPTION</span>
      <button class="copy-btn" id="copyBtn">복사</button>
    </div>
    <div class="caption-text" id="captionText"></div>
  </div>
</div>

<div class="lightbox" id="lightbox"><img id="lightboxImg" alt=""></div>

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;700;800&display=swap">
<script>
  const slides = ${JSON.stringify(slides)};
  const CAPTION = ${jsStr(caption)};

  document.getElementById('captionText').textContent = CAPTION;

  const filmstrip = document.getElementById('filmstrip');
  slides.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'slide';
    div.innerHTML = '<img src="' + s.dataUri + '" alt="slide ' + (i + 1) + '" loading="lazy">' +
      '<span class="idx">' + String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0') + '</span>';
    div.addEventListener('click', () => openLightbox(s.dataUri));
    filmstrip.appendChild(div);
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  function openLightbox(src){ lightboxImg.src = src; lightbox.classList.add('open'); }
  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));

  function fallbackCopy(text){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e2) {}
    document.body.removeChild(ta);
  }

  const copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard api');
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500));
      await Promise.race([navigator.clipboard.writeText(CAPTION), timeout]);
    } catch (e) {
      fallbackCopy(CAPTION);
    }
    copyBtn.textContent = '복사됨';
    copyBtn.classList.add('copied');
    setTimeout(() => { copyBtn.textContent = '복사'; copyBtn.classList.remove('copied'); }, 1600);
  });

  const saveBtn = document.getElementById('saveAllBtn');
  const statusLine = document.getElementById('statusLine');
  const progressTrack = document.getElementById('progressTrack');
  const progressFill = document.getElementById('progressFill');

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  async function saveAll(){
    if (!window.claude || !window.claude.downloads) {
      statusLine.textContent = '이 화면에서는 저장 기능을 쓸 수 없어요 — claude.ai 앱에서 열어주세요.';
      return;
    }
    saveBtn.disabled = true;
    progressTrack.classList.add('show');
    statusLine.classList.remove('ok');

    for (let i = 0; i < slides.length; i++) {
      statusLine.textContent = '이미지 저장 중... (' + (i + 1) + '/' + slides.length + ') 저장 확인 창을 확인해주세요';
      progressFill.style.width = Math.round((i / slides.length) * 100) + '%';
      let attempt = 0;
      for (;;) {
        try {
          const blob = await (await fetch(slides[i].dataUri)).blob();
          await window.claude.downloads.save({ filename: slides[i].filename, data: blob });
          break;
        } catch (e) {
          const code = e && e.code;
          if (code === 'declined') {
            statusLine.textContent = '저장이 취소됐어요. 버튼을 다시 눌러 이어서 저장할 수 있어요.';
            saveBtn.disabled = false;
            return;
          }
          if (code === 'rate_limited' && attempt < 5) {
            attempt++;
            await sleep(700);
            continue;
          }
          statusLine.textContent = '저장 중 오류가 발생했어요: ' + (e && e.message ? e.message : String(e));
          saveBtn.disabled = false;
          return;
        }
      }
    }
    progressFill.style.width = '100%';
    statusLine.textContent = slides.length + '장 모두 저장 완료!';
    statusLine.classList.add('ok');
    saveBtn.disabled = false;
  }

  saveBtn.addEventListener('click', saveAll);
</script>
`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html, 'utf8')
console.log('wrote ' + out + ' (' + slides.length + ' slides, ' + Math.round(html.length / 1024) + ' KB)')
