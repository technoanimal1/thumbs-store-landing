# beat.cc — what's left to finish

State verified 9 Oct 2026, 16:30 UTC.

## Where we are

| | |
|---|---|
| API feed | **live** — 3,663 games, 19 providers, `white` |
| Licensed to their branch | 3,694 |
| Baked | 3,694 (100%) |
| Their DEV catalogue (BGaming, Evolution, Pragmatic) | ~1,686 games |
| Of which we cover | **1,036 (≈62%)** |

They can fetch today. Nothing is half-wired: everything mapped is licensed,
baked and served.

---

## 0. Blocking — needs beat.cc, not us

**Get the confirmed production game list, all providers, one file, with
SoftSwiss identifiers.**

Everything below is sized against a moving target until this lands. So far we
have had: three providers, dev only, minus their own mapping fixes, minus
SoftSwiss recalls — and Yuka has already said a consolidated list is coming and
that other providers remain in scope. We have now analysed two partial lists.
A third partial list should not start a third analysis.

---

## 1. Do now — client-visible, no decisions needed

**1.1 Re-bake 922 stale thumbnails.**
Their feed is currently serving 922 images whose logo still has the black
keyline we removed today. The logos are fixed; the baked PNGs are not. Restrict
the bake to changed games rather than re-running the whole branch.

**1.2 Add a content version to the feed — do this with 1.1, not after.**
`published_at` does not change when an image is re-baked. Same path, same
timestamp, new bytes. If beat.cc diffs on `published_at` to decide what to
re-download — which is the obvious way to consume this feed — **they will never
pick up the 922**, and their CDN will serve the striped version indefinitely.
Expose `baked_at` or a content hash per game. Small feed change, and it makes
every future logo fix propagate on its own.

**1.3 Restore the coverage gate.**
`min_coverage` for beat-cc is **0**; it was lowered for debugging. Real
coverage is 100%, so set it back to **0.95**. Right now the safety net that
catches a broken feed is switched off.

**1.4 Open 95 finished thumbnails still closed to them.**
BGaming / Evolution / Pragmatic games with complete artwork that are not in
their branch. Mostly Pragmatic Live, which was 100% closed until today.
Commercial call, but the work is already paid for.

---

## 2. Needs a decision — the bulk of their 618

Of the 618 they sent, 62 are now mapped, licensed and baked. The rest split
into four questions, none of which are technical:

**2.1 The 506 live dealer tables.** *Blackjack Classic 18*, *Speed Baccarat Q*,
*Klasik Blackjack 12* — 382 of them blackjack. No provider ships per-table key
art. Proposal: one template per family (Blackjack, Baccarat, Roulette, Sic Bo)
that renders each table's own name as type, so every game ID still gets a
unique, correct thumbnail. Four designs instead of 506 commissions.
*Needs: beat.cc to accept the approach, then one design pass.*

**2.2 45 games genuinely needing artwork.** Real titles with their own
branding — Chicken Shot, Candy Rush, Jade Legends, Ra vs Osiris and 41 more.
This is the only true artwork backlog in the 618.
*Needs: go-ahead, then normal production.*

**2.3 17 cross-provider matches.** We hold art under the title but filed to a
different studio — e.g. their `pragmaticexternal:SpeedRoulette` matches our
*Evolution* Speed Roulette. Usable pixels, wrong brand.
*Needs: beat.cc to accept, or we draw them properly.*

**2.4 77 numbered language variants.** "Turkish Blackjack 10" vs our
"Blackjack 10" — same number, different physical table. Covered correctly by
2.1 if that lands; only an issue if it does not.

*(13 unnumbered language variants — Crazy Time Italia, Turkish Lightning
Roulette, Korean ONE Blackjack and similar — are already done. One base image
legitimately covers each.)*

---

## 3. Internal hygiene — invisible to beat.cc, real cost to us

- **31 duplicate rows** (29 Pragmatic, 2 Play'n Go). Same game, same slug,
  imported from 4 different Figma files. The feed collapses them, so the client
  sees one — but we render, whiten and bake each twice. Both twins carry
  overrides, so they need eyes before deletion, not a bulk delete.
- **223 `gameNNN` rows**, 210 with real artwork — genuine games whose Figma
  frame was never titled. Needs naming in Figma, then a re-sync, then a merge
  step so the renamed row does not arrive as a second game.
- **105 phantom rows** (`Variant 4`, `Yes`, `1`) with no artwork at all, left
  over from a sync bug since fixed. Safe to delete.
- **12 games** whose cached white logo is byte-identical to the colour one
  (5 in beat.cc). The PG Soft family of this fault is fixed; these are the
  remainder.
- **1 logo** OpenAI refuses on the title (Nolimit City). Needs drawing by hand.
- **Scratch to clean up:** `img-probe` edge function, `beat_req`,
  `beatcc_open_candidates`, `beatcc_open_backup`, `pgsoft_logo_remap_backup`,
  and `derived/white/zz-stroke-test.png`.

---

## Suggested sequence

1. Ask Yuka for the production list **and** agree the table-template approach —
   same message, since 2.1 decides 80% of the scope.
2. While waiting: 1.1 + 1.2 + 1.3 + 1.4. All ours, no blockers.
3. On their answer: commission the 45, build the 4 templates.
4. Hygiene in the gaps.

The honest headline for beat.cc: **the integration is done and serving.** What
remains is catalogue coverage, and most of that is one product decision about
dealer tables rather than a queue of design work.
