/**
 * Crisp live chat for the marketing site.
 *
 * The seven static pages each load this one file rather than carrying their own
 * copy of the snippet, so the website ID lives in exactly one place. Pasting
 * Crisp's installation snippet into every page is how a site ends up with the
 * chat quietly missing from /pricing — the page a hesitant buyer is most likely
 * to be on when they want to ask something.
 *
 * Same website ID as the app (dashboard sets it via VITE_CRISP_WEBSITE_ID), so
 * someone who asks a question here and signs up later keeps one conversation
 * thread instead of arriving twice as a stranger.
 *
 * The ID below is not a secret — Crisp ships it to the browser by design, and
 * it only names which inbox to open. Blanking it switches the chat off across
 * the whole marketing site without touching seven pages.
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
