#!/usr/bin/env node
// Exports each artboard in a run folder's canvas.json to a numbered PNG
// (01.png, 02.png, ...) ready to drag straight into Instagram's carousel
// uploader in order. Results land in output/<run folder name>/ at the
// project root (NOT nested inside runs/), so the upload-ready files stay
// one level deep and easy to find.
//
// Usage:
//   node tools/export_cardnews.mjs --dir runs/2026-08-31-economy [--chrome "C:\path\to\chrome.exe"]

import { existsSync, mkdirSync, readdirSync, copyFileSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join, basename, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function arg(name){ const i = process.argv.indexOf('--' + name); return i === -1 ? undefined : process.argv[i + 1] }
function fail(msg){ console.error('export-cardnews: ' + msg); process.exit(1) }

const dir = arg('dir')
if(!dir) fail('need --dir <run folder>')
const dirAbs = resolve(dir)
if(!existsSync(dirAbs)) fail(dirAbs + ' does not exist')

const canvasPath = join(dirAbs, 'canvas.json')
if(!existsSync(canvasPath)) fail('no canvas.json in ' + dirAbs)
const canvas = JSON.parse(readFileSync(canvasPath, 'utf8'))
const artboards = canvas.artboards || []
if(!artboards.length) fail('canvas.json has no artboards')

const DEFAULT_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const chrome = arg('chrome') || DEFAULT_CHROME_PATHS.find(p => existsSync(p))
if(!chrome) fail('no Chrome/Edge found in default locations; pass --chrome <path>')

// The .dc.html files reference background images by flat filename
// (e.g. "point1-bg.jpg"), matching how the design canvas stores them —
// but on disk those live under assets/. Stage flat copies so the
// standalone file:// render can find them, then clean up afterward.
const assetsDir = join(dirAbs, 'assets')
const stagedImages = []
if(existsSync(assetsDir)){
  for(const f of readdirSync(assetsDir)){
    if(!/\.(jpe?g|png)$/i.test(f)) continue
    const dest = join(dirAbs, f)
    if(!existsSync(dest)){
      copyFileSync(join(assetsDir, f), dest)
      stagedImages.push(dest)
    }
  }
}

const exportDir = join(projectRoot, 'output', basename(dirAbs))
mkdirSync(exportDir, { recursive: true })

let ok = 0
try{
  artboards.forEach((a, i) => {
    const file = a.file
    const src = join(dirAbs, file)
    if(!existsSync(src)){ console.warn('skip ' + file + ' (not found)'); return }
    const idx = String(i + 1).padStart(2, '0')
    const outPath = join(exportDir, idx + '.png')
    const url = pathToFileURL(src).href
    try{
      execFileSync(chrome, [
        '--headless', '--disable-gpu', '--hide-scrollbars',
        '--force-device-scale-factor=1', '--window-size=1080,1350',
        '--screenshot=' + outPath, url
      ], { stdio: 'pipe' })
      ok++
      console.log('wrote ' + idx + '.png <- ' + file)
    }catch(e){
      console.error('failed on ' + file + ': ' + e.message)
    }
  })
} finally {
  for(const p of stagedImages) unlinkSync(p)
}

// Pull the caption out of script.md (a single "- 캡션: ..." bullet with
// literal \n paragraph breaks) so it's ready to paste into Instagram too.
const scriptPath = join(dirAbs, 'script.md')
if(existsSync(scriptPath)){
  const scriptText = readFileSync(scriptPath, 'utf8')
  const m = scriptText.match(/^- 캡션:\s*(.+)$/m)
  if(m){
    const caption = m[1].replace(/\\n/g, '\n')
    writeFileSync(join(exportDir, 'caption.txt'), caption, 'utf8')
    console.log('wrote caption.txt')
  } else {
    console.warn('no "- 캡션:" line found in script.md; skipped caption.txt')
  }
}

console.log('done: ' + ok + '/' + artboards.length + ' slides exported to ' + exportDir)
if(ok !== artboards.length) process.exit(1)
