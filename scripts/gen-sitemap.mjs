#!/usr/bin/env node
/**
 * Regenerate site/sitemap.xml from the files actually on disk.
 *
 * Scans every .html under site/, drops anything that shouldn't be indexed
 * (404, noindex pages, the private /preprod, /offer and coverage pages), maps
 * each file to its clean URL, and stamps a real <lastmod> from the file's last
 * git commit date (today for files not yet committed). New pages — provider
 * pages, blog posts, game pages — are picked up automatically the next time
 * this runs; nothing to hand-edit.
 *
 *   node scripts/gen-sitemap.mjs
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SITE = join(ROOT, 'site')
const BASE = 'https://www.thumbs.store'
const TODAY = new Date().toISOString().slice(0, 10)

// Paths (clean, no leading slash) never put in the sitemap.
const SKIP_EXACT = new Set(['404', 'pricing', 'order-form-beat-gg'])
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

function gitDate(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT }).toString().trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : TODAY
  } catch {
    return TODAY
  }
}

// priority / changefreq by URL shape
function meta(path) {
  if (path === '') return ['1.0', 'weekly']
  if (path === 'studio' || path === 'providers') return ['0.9', 'weekly']
  if (path.startsWith('providers/')) return ['0.7', 'weekly']
  if (path === 'blog') return ['0.6', 'weekly']
  if (path.startsWith('blog/')) return ['0.7', 'monthly']
  if (path.startsWith('thumbnails/')) return ['0.6', 'monthly'] // game pages, if ever added
  if (path === 'license') return ['0.3', 'yearly']
  return ['0.5', 'weekly']
}

const urls = []
for (const file of walk(SITE)) {
  const path = cleanPath(file)
  if (SKIP_EXACT.has(path)) continue
  if (SKIP_PREFIX.some((p) => path.startsWith(p))) continue
  const html = readFileSync(file, 'utf8')
  if (/name=["']robots["'][^>]*noindex/i.test(html)) continue
  const [priority, changefreq] = meta(path)
  urls.push({ loc: `${BASE}/${path}`.replace(/\/$/, '') || `${BASE}/`, lastmod: gitDate(file), changefreq, priority })
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
  .map((u) => `  <url><loc>${u.loc === BASE ? BASE + '/' : u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
  .join('\n')
writeFileSync(join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
console.log(`sitemap.xml: ${urls.length} urls`)
