// Edge Middleware: exact 301 redirects and 410 Gone responses.
// vercel.json redirects can only emit 308 and cannot emit 410, so these live here.
//
// IMPORTANT: the apex -> www 301 below works ONLY while the apex domain
// (thumbs.store) has NO domain-level redirect in Vercel (Settings -> Domains).
// If a domain-level redirect is re-added there, it runs first (as a 308) and
// this 301 never fires. Keep apex attached with no redirect.

export const config = { matcher: '/:path*' }

const GONE = new Set([
  '/apply',
  '/partners',
  '/blog/casino-game-thumbnails-the-ultimate-guide-for-igaming-operators',
  '/blog/how-setanta.bet-solved-website-thumbnail-problems-with-thumbs.store',
  '/blog/igaming-ui-assets-how-to-build-a-scalable-visual-system-for-your-platform',
  '/blog/slot-game-graphics-for-operators-what-you-need-to-know',
])

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

  if (host.endsWith('thumbs.store') && host !== 'www.thumbs.store' && host !== 'app.thumbs.store') {
    return Response.redirect(WWW + path + url.search, 301)
  }
  if (GONE.has(path)) return gone()
  if (path === '/terms') return Response.redirect(WWW + '/license', 301)
  if (path.startsWith('/blog/')) {
    const slug = path.slice(6).replace(/\/$/, '')
    if (slug && !REAL_POSTS.has(slug)) return Response.redirect(WWW + '/blog', 301)
  }
  return undefined
}
