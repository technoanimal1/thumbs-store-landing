// Edge Middleware: exact 301 redirects and 410 Gone responses.
// Vercel's vercel.json `redirects` can only emit 308 (permanent) / 307, and
// cannot emit 410, so these are handled here to meet the SEO requirements.

const GONE = new Set([
  '/apply',
  '/partners',
  '/blog/casino-game-thumbnails-the-ultimate-guide-for-igaming-operators',
  '/blog/how-setanta.bet-solved-website-thumbnail-problems-with-thumbs.store',
  '/blog/igaming-ui-assets-how-to-build-a-scalable-visual-system-for-your-platform',
  '/blog/slot-game-graphics-for-operators-what-you-need-to-know',
])

// The real, kept blog posts. Any other /blog/<slug> is an old/removed slug and
// 301s to /blog (preserving the previous catch-all behaviour).
const REAL_POSTS = new Set([
  'why-hand-made-thumbnails-dont-scale',
  'automatic-updates-and-the-api',
  'one-flat-price-every-release-included',
  'thumbs-store-vs-aggregator-thumbnails',
  'inside-the-studio',
])

const WWW = 'https://www.thumbs.store'

function gone() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>410 Gone</title><h1>410 Gone</h1><p>This page has been permanently removed.</p>',
    { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } },
  )
}

export default function middleware(request) {
  const url = new URL(request.url)
  const host = (request.headers.get('host') || url.host).toLowerCase()
  const path = url.pathname

  // 1. Apex (or any non-www thumbs.store host) -> 301 to www, one hop, keep path+query.
  if (host.endsWith('thumbs.store') && host !== 'www.thumbs.store' && host !== 'app.thumbs.store') {
    return Response.redirect(WWW + path + url.search, 301)
  }

  // 2. Removed pages -> 410 Gone.
  if (GONE.has(path)) return gone()

  // 3. /terms -> 301 /license.
  if (path === '/terms') return Response.redirect(WWW + '/license', 301)

  // 4. Any other old blog slug -> 301 /blog.
  if (path.startsWith('/blog/')) {
    const slug = path.slice(6).replace(/\/$/, '')
    if (slug && !REAL_POSTS.has(slug)) return Response.redirect(WWW + '/blog', 301)
  }

  // Everything else continues to the static file.
  return undefined
}
