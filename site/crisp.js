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
