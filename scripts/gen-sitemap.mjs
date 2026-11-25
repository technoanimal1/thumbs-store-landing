#!/usr/bin/env node
/**
 * Regenerate site/sitemap.xml from the files actually on disk.
 *
 * Scans every .html under site/, drops anything that shouldn't be indexed
 * (404, noindex pages, the private /preprod, /offer and coverage pages), maps
 * each file to its clean URL, and stamps a real <lastmod> from the file's last
 * meaningful git commit date (today for files that are new or have uncommitted
 * changes). New pages — provider pages, blog posts, game pages — are picked up
 * automatically the next time this runs; nothing to hand-edit.
 *
 * Only <loc> and <lastmod> are written. Google ignores <changefreq> and
 * <priority>, and only trusts <lastmod> when it is consistently accurate —
 * hence LASTMOD_IGNORE_COMMITS below.
 *
 *   node scripts/gen-sitemap.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SITE = join(ROOT, 'site')
const BASE = 'https://www.thumbs.store'
const TODAY = new Date().toISOString().slice(0, 10)

// Paths (clean, no leading slash) never put in the sitemap.
const SKIP_EXACT = new Set(['404', 'order-form-beat-gg'])
const SKIP_PREFIX = ['preprod/', 'offer/', 'coverage-private']

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

// file path -> clean URL path, e.g. site/providers/netent.html -> providers/netent
function cleanPath(file) {
  let rel = relative(SITE, file).replace(/\\/g, '/')
  rel = rel.replace(/\.html$/, '')
  rel = rel.replace(/\/index$/, '')
  if (rel === 'index') rel = ''
  return rel
}

// Commits that touched many pages without changing their content (a favicon
// link, a tracking snippet, a footer credit). They are skipped when dating a
// file, so a site-wide trivial edit doesn't mark every page as modified.
// Add the short or full hash of any such commit here.
const LASTMOD_IGNORE_COMMITS = [
  'e2488e9', // 2026-11-25 — new favicon links on 43 pages
  'af3b569', // 2026-11-25 — 'By Cubicle' footer credit linked across the site
]

// Date (YYYY-MM-DD) of the latest commit that touched `file` and is not in
// LASTMOD_IGNORE_COMMITS. Falls back to today when the file is untracked, has
// uncommitted changes, or git isn't available; and to the newest commit of all
// if every commit touching the file is ignored.
function gitDate(file) {
  try {
    const git = (args) => execFileSync('git', args, { cwd: ROOT }).toString().trim()
    if (git(['status', '--porcelain', '--', file])) return TODAY
    const log = git(['log', '--format=%H %cs', '--', file]).split('\n').filter(Boolean)
    if (!log.length) return TODAY
    const kept = log.find((line) => !LASTMOD_IGNORE_COMMITS.some((h) => line.startsWith(h)))
    const d = (kept || log[0]).split(' ')[1]
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : TODAY
  } catch {
    return TODAY
  }
}

const urls = []
for (const file of walk(SITE)) {
  const path = cleanPath(file)
  if (SKIP_EXACT.has(path)) continue
  if (SKIP_PREFIX.some((p) => path.startsWith(p))) continue
  const html = readFileSync(file, 'utf8')
  if (/name=["']robots["'][^>]*noindex/i.test(html)) continue
  urls.push({ loc: `${BASE}/${path}`.replace(/\/$/, '') || `${BASE}/`, lastmod: gitDate(file) })
}

// stable, readable order: home, studio, providers, provider pages, blog, posts, rest
const rank = (u) => {
  const p = u.loc === BASE ? '' : u.loc.replace(BASE + '/', '')
  if (p === '') return 0
  if (p === 'studio') return 1
  if (p === 'providers') return 2
  if (p.startsWith('providers/')) return 3
  if (p === 'blog') return 4
  if (p.startsWith('blog/')) return 5
  return 6
}
urls.sort((a, b) => rank(a) - rank(b) || a.loc.localeCompare(b.loc))

const body = urls
  .map((u) => `  <url><loc>${u.loc === BASE ? BASE + '/' : u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
  .join('\n')
writeFileSync(join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
console.log(`sitemap.xml: ${urls.length} urls`)
