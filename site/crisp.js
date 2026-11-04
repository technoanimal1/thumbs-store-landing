/**
 * Crisp live chat for the marketing site.
 *
 * All forty-odd static pages load this one file rather than carrying their own
 * copy of Crisp's install snippet — the home page, pricing, the studio tour,
 * the twenty-eight provider pages people arrive on from search, and the private
 * offer pages. Pasting the snippet per page is how a site ends up with the chat
 * quietly missing from /pricing, the page a hesitant buyer is most likely to be
 * on when they finally want to ask something.
 *
 * Same website ID as the app, so someone who asks a question here and signs up
 * a week later keeps one conversation thread instead of arriving twice as a
 * stranger.
 *
 * The ID below is not a secret — Crisp ships it to the browser by design, and
 * it only names which inbox to open. Blanking it switches the chat off across
 * the whole site without touching forty pages.
 */
;(function () {
  var WEBSITE_ID = 'cc685043-11d4-4c53-8bbb-ddbbbd395d7b'

  if (!WEBSITE_ID) return

  window.$crisp = []
  window.CRISP_WEBSITE_ID = WEBSITE_ID

  var s = document.createElement('script')
  s.src = 'https://client.crisp.chat/l.js'
  s.async = true
  document.head.appendChild(s)
})()

/**
 * Google Ads conversion tracking (account 283-978-3968, tag AW-18335239782).
 *
 * It lives in this file because every marketing page already loads it, so one
 * edit covers all forty-odd pages. It loads the Google tag (which keeps the ad
 * click on a .thumbs.store cookie that app.thumbs.store can read too, so a
 * sign-up in the app is credited to the ad) and counts a click on any "Book a
 * demo" cal.com link as the "Demo booking click" conversion.
 */
;(function () {
  var TAG_ID = 'AW-18335239782'
  var DEMO_CLICK = 'AW-18335239782/k0yuCN3jorIdEOac9qZE'

  if (!TAG_ID) return

  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
  }

  var s = document.createElement('script')
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG_ID
  s.async = true
  document.head.appendChild(s)
  window.gtag('config', TAG_ID)

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="cal.com/"]')
    if (a) window.gtag('event', 'conversion', { send_to: DEMO_CLICK })
  }, true)
})()
