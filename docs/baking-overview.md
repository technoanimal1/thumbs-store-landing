# Baking: how it works, and what to fix

Written 29 Oct 2026 against dashboard `main` at `c843bc2`.

## 1. The pipeline

A "bake" turns each card into two files (PNG and WebP) on storage and records
a row in `thumbnail_exports`, which is what the API serves.

| Step | Where | What it does |
|---|---|---|
| Choose scope | `BranchExport.tsx` | Backlog from `bake_backlog()`, or an explicit selection / queue view. |
| Scan | `BranchExport.scan()` | Loads thumbnails (pages of 1,000), branch_games, provider slugs and existing export sigs. Resolves each card's params and signature. Builds the work list. |
| Render + upload | `BranchExport.bake()` → `exportThumb.renderThumbBlobs` | A worker pool renders each card **in the browser** at 2× and uploads to `<branch>/<provider>/<variant>/<game>.{png,webp}`. Pool: 12 workers on desktop, 2 on phone, adaptive. |
| Index | `bake()` | Export rows are upserted 50 at a time, keyed on `(thumbnail_id, branch_id, variant)`, carrying the signature. |
| Clear flag | DB trigger `thumbnail_exports_clear_pending` | `thumbnails.publish_pending` is cleared on every export insert or update. |
| Auto-republish | `apiRebake.rebakeThumbnailExports` | When a card changes in the studio, every export row for it is re-rendered if its signature has moved. |
| Grid preview | `bakePreview.ts` | A separate 480px WebP per card, in the `previews` bucket. Its own signature in `thumbnails.preview_sig`. |
| Single card | `pages/RenderOne.tsx` | Renders one card for the export button. |
| Dots in the rail | `provider_bake_status()` | Counts outstanding work per provider for the dots. |

## 2. What "should look like" is computed from

Every path resolves the same stack, in this order:

```
withDefaults(template)
  → branchParams(template, brand frame design)
  → effectiveParams(…, merge(catalogue override, brand override), branchKvSizes(frame))
  → { sizeKey: branch size, logoVariant: variant }
```

`previewSig()` hashes the resolved params together with the asset paths and
the name, prefixed with `RENDER_VERSION`. Equal signature means the stored
file is still correct.

## 3. The biggest source of bugs: four copies of one resolver

The same merge is written out four times:

- `ThumbnailStudio.paramsForThumb` and `activeParams`
- `BranchExport.scan()`
- `apiRebake.rebakeThumbnailExports()`
- `RenderOne`

The brand-override bug happened because the bake's copy missed a layer the
studio used. Every copy has to agree, and nothing checks that they do.

**Fix:** one `resolveCardParams(template, brandFrame, catalogueOverride,
brandOverride, { sizeKey, variant })`, imported by all four.

## 4. Two definitions of "baked", and they disagree

- **Database** (`bake_backlog`, `provider_bake_status`): a card is outstanding
  if it has no export row, or `publish_pending` is set, or the signature's
  renderer prefix is not `v45`. It never compares the full signature.
- **Client** (`scan()`): a card is up to date only if its full stored
  signature equals the one just computed.

So the panel can say "N to bake" and then re-render more or fewer cards than
N. This session it happened in practice: adding a default key changed every
card's full signature without touching the database view, so "new & changed
only" would have re-rendered whole brands that were fine. The default is now
excluded from the hash (see §5), but the structure that allowed it remains.

**Fix:** one source of truth. Store the signature a card should have on the
card row, computed by the same code that renders it, and have the backlog
compare full signatures.

## 5. Hashing is fragile

- **Any new default key rehashes every card.** Fixed for `glTitleLines` by
  leaving `auto` out of the hash. The general fix is to drop every key whose
  value equals its default before hashing, so this cannot recur silently.
- **A golden test is missing.** Store a few (template, frame, overrides,
  card) tuples with their expected signatures and fail CI when one moves.
  That is the guard that would have caught the Lines change on the day.
- **`RENDER_VERSION` is bumped by hand.** Forgetting it serves stale files;
  bumping it re-renders everything. Deriving it from a hash of the renderer
  sources at build time would make the right thing automatic. The cost is
  that any renderer edit invalidates everything, which is correct, because
  renderer edits change pixels.

## 6. Rendering happens in a browser tab

This is the largest operational problem. A 3,000-card bake is a long job run
by whichever designer's device is open:

- The tab has to stay open. A wake lock helps on phones but does not survive
  a closed laptop.
- A phone gets two workers, so a full bake is slow there.
- Results depend on the device and its fonts.
- Every card's work is decided by the client.

**Fix:** render on the server, in an edge function or a Node worker, from
the same resolver (§3). The renderer uses `CanvasRenderingContext2D` and
`Image`, so this needs a canvas implementation (node-canvas, or headless
Chromium behind a queue). It is a real project, and it is the change that
makes the rest reliable.

## 7. Scanning does too much work on the client

For the "all" scope, `scan()` downloads every thumbnail row (`select *`) and
every `branch_games` row, just to order licensed games first. Most of that
data is never used by the bake.

**Fix:** one database function returning `(thumbnail_id, provider,
expected_signature)` for the branch, so the client receives only the work
list.

## 8. Variants: publishing the wrong set

- The panel's variant defaults to `white` and is not tied to the brand.
- beat.cc is a text-title brand. Its logotype never reaches a pixel, yet its
  2,574 exports sit under `white/`. The `color/` folder is empty on every
  branch.

**Fix:** a per-branch setting for which variants publish. For text-title
brands, publish one set and hide the other.

## 9. Smaller things

- `webpPath` is exported from `components/BranchExport.tsx` and imported by
  `lib/apiRebake.ts`. A library depends on a component. Move it to `lib/`.
- Two caches (`thumbnail_exports` for the API, `thumbnails.preview_sig` for
  the grid) use two signatures from two callers, so they can disagree. Unify
  them with §4.
- Every override save clears the card's `preview_url`, so the grid repaints
  for each change. Debounce it.
- If an upload succeeds and the index flush then fails, the card is simply
  re-rendered next run. That heals itself, but nothing reports it. Count
  unindexed uploads and show them.
- Two catalogue games with the same provider and slug share one storage path
  (`takenPaths`), so one overwrites the other. Pick the winner explicitly.

## 10. What changed this session

- Brand overrides are now merged in the bake, the auto-republish and the
  single-card render (`2f6c63e`). Before, every brand-framed card baked
  without its framing.
- A trigger on `branch_thumb_overrides` marks cards for republish, and the
  affected cards were backfilled (`publish_pending`).
- The rail dots re-read when a run ends and use the variant the panel bakes
  (`c843bc2`).
- The `glTitleLines` default no longer changes existing signatures
  (`c843bc2`).

**Not verified:** one stored signature could not be reproduced from the
current code. Blondes and Beers (beat.cc, white, `v45_b2iik`, baked
20:47 on 28 Oct) recomputes to a different value with the brand row, and to
another without it. Some input differs from bake time, and the frame design
carries no timestamp to check against. So before a full "new & changed only"
run, bake one provider first and compare the number of files uploaded with
the panel's count.

## 11. Suggested order

1. Golden test and canonical hashing (§5). Small, and it prevents the
   recurrence.
2. One resolver (§3). Removes the class of bug that bit twice today.
3. One source of truth for "baked" (§4). Makes the panel's count honest.
4. Server-side rendering (§6). The big one, and the one that stops a bake
   depending on a laptop staying open.
5. Variant policy per branch (§8).
