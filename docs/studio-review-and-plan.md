# Thumbs Studio: review and plan

Reviewed 29 Oct 2026 against dashboard `main` at `c843bc2`. Subject:
`src/components/ThumbnailStudio.tsx` (3,710 lines) and the hooks and
components it depends on. Nothing has been changed by this review; the plan
below is for decision.

Method: code read against the current tree, with counts from grep. I did not
run the app in a browser, did not measure rendering time, and did not test on
a phone. Those are called out where they matter.

---

## 1. Summary

The studio's main problem is not the visual design. It is that **you cannot
tell, from the screen, what a click will save, where it will be saved, or
whether it saved.** That is the root of the "I fixed it and it came back"
reports, and it is also why several of the bugs fixed this week happened.

Five things, in order of harm:

1. **Work can be lost silently.** Nine database writes in the data hook never
   check their error, and delete removes the card from the screen before the
   database has accepted the delete. Nothing warns before a refresh.
2. **Three persistence models in one panel.** Some edits save as you make
   them, some wait for Save, and Save commits more than the thing you are
   looking at.
3. **The editing target is implicit.** Five independent pieces of state decide
   whether a control changes one game, a selection, a brand's frame, a brand's
   game, or the template for every card. The canvas does not say which.
4. **Ten view flags for one question: what am I looking at?** Seven view
   buttons each reset the other flags by hand.
5. **The grid does not scale.** No virtualisation, no memoised tiles, and
   every tile re-resolves its parameters on every render. Not measured, but
   the structure predicts it.

Secondary: the component is too large to change safely, it has no tests, and
it carries duplicate UI helpers and possibly dead files.

---

## 2. Code review

### 2.1 Data loss and silent failure (highest priority)

| # | Where | Problem |
|---|---|---|
| C1 | `useThumbnailsData.ts` 243, 263, 270, 278, 284, 319, 351 | `setAccent`, `saveAnim`, `saveAnimAlpha`, `saveLogoWhite`, `saveLogoColor`, `savePreview`, `setFreePack`: `await supabase…update()` with no error check. A rejected write looks like a success. |
| C2 | `useThumbnailsData.ts` 594–600 | `deleteThumbnail` removes the card from state **before** the database call and ignores its error. A failed delete looks like a success until a reload brings the card back. |
| C3 | `useThumbnailsData.ts` 603–608 | `insertThumbnail` (the undo for delete) also ignores errors. |
| C4 | `ThumbnailStudio.tsx` 1403–1406 | Delete pushes an undo that re-inserts a row which may never have been deleted. |
| C5 | `ThumbnailStudio.tsx` 1264–1265 | Bulk Save loops `saveOverrides` sequentially with no error handling. A failure part-way leaves some games saved and some not, with no report. |
| C6 | `ThumbnailStudio.tsx` 1265 | Bulk Save uses `overrides[id] ?? {}`. If a selected game is missing from local state, it writes an **empty override**, which erases its saved framing. Selection normally implies the card loaded, so this is unlikely, but nothing prevents it. |
| C7 | `ThumbnailStudio.tsx` 1265 on a brand | Bulk Save writes the **shared catalogue row** for every selected game, even on a brand where the edits were already saved to the brand's own row. The write is harmless in content, but it clears each game's preview and re-queues it for rebake. |
| C8 | `ThumbnailStudio.tsx` 1275 | Single-game Save also commits the template if the template is dirty (`if (!savedTemplate && globalDirty) await save(params)`). You are not told. |
| C9 | No `beforeunload` in the studio | Only the bake panel warns. Unsaved catalogue overrides, template edits and frame edits are lost on refresh or navigation. Undo is held in memory (`undoStack`, line 254) and is lost the same way. |
| C10 | Toast-only feedback | Failures are shown as a toast that disappears. Nothing persists until the user acts. |

### 2.2 The editing target

Five state values decide what a control writes to:

- `scope` (`'global' | 'selected'`, line 153)
- `selectedId`
- `bulkMode` (derived: selection mode with items selected)
- `editingOne`, `editingBranch` (derived from the above and the branch)
- `onBranch` (from the route)

Referenced 28 times (`editingBranch`), 15 (`bulkMode`), 14 (`scope === 'global'`),
12 (`editingOne`). Each writer repeats the same if/else chain, and the chains
differ. This is the mechanism behind every "it saved to the wrong layer" bug
this week. Examples:

- `set()` (line 971) writes to the brand's row, the catalogue row, the frame
  design or the template, depending on five conditions.
- `patchSelected` (line 931) writes to the brand row on a brand and to the
  catalogue otherwise.
- `handleSave` (line 1251) and `handleReset` (line 1280) each re-derive the
  same branches with slightly different rules.

### 2.3 Filters and view state

Ten independent flags describe what is on screen: `freePackOnly`,
`branchOnly`, `needsReviewOnly`, `whiteMissingOnly`, `needsBakeOnly`,
`rebakeOnly`, `activeProvider`, `gameQuery`, `reviewProvider`, `reviewLevel`.

Seven rail buttons each set one flag true and clear the others by hand, so the
rule "only one view at a time" lives in seven copies. `gridItems` (line 651)
then chains conditionals over the flags, and combinations that should not
exist can occur (for example a provider filter that survives a queue switch).

### 2.4 Performance (not measured)

- `gridItems.map` (line 2551) renders every loaded game. There is no
  virtualisation, and nothing caps the count.
- `GridTile` is not memoised (no `memo` in `GridTile.tsx`).
- `paramsForThumb` (line 494) runs the full resolver for every tile on every
  studio render. Each tile then calls `previewSig`, which calls
  `JSON.stringify` on the whole params object (`previewSig.ts` line 21).
- Three arrays hold the same games (`thumbnails`, `pageItems`, `allItems`,
  `useThumbnailsData.ts` 38–46). `patchLocal` has to patch all three, and the
  comment at line 60 records a bug caused by one being missed.

The likely cost is that any state change (a toast, a selection, a slider
step) re-resolves and re-hashes every loaded tile. A profile with 1,000 tiles
loaded would confirm or rule this out. I did not run one.

### 2.5 Structure and maintainability

- One component: `ThumbnailStudio` is 3,710 lines with 57 `useState`, 34
  `useEffect`, 47 inline `onClick` arrows, and five helper components defined in the same file.
- Duplicate UI primitives: `Section`, `Group`, `Row`, `Seg` are defined in
  `FramesView.tsx` (554–593), `TemplateView.tsx` (497–535) and
  `ThumbnailStudio.tsx` (3573–3624). `Row`, `Toggle` and `Slider` also exist
  in `LayoutControls.tsx`.
- Possibly dead: `ClientOnboarding.tsx` and `FrameBuilder.tsx` are not
  imported anywhere in `src/`. Confirm before deleting.
- **No tests.** There is no `test` script in `package.json` and no test files
  in `src/`. Everything this week was verified with throwaway `esbuild`
  scripts. The brand-override bug, and the Lines regression that changed
  every card's signature, would both have been caught by a golden test.
- `window.prompt` (lines 1465, 1577, 1659) and `window.confirm` (1402, 1657)
  are used for flag notes and for the typed-count delete confirmation.
- The bake panel is embedded in the sidebar (line ~2304). Publishing and
  editing share one column.

---

## 3. User experience review

### 3.1 Persistence is inconsistent

Measured against the code, not the labels:

| Control | When it saves |
|---|---|
| Brand, per-game control (title size, lines, logo, zoom) | As you change it |
| Brand, placement (KV, logo) | As you drag it |
| Brand, bulk placement | As you drag it |
| Single game, palette or colour (sidebar and card swatch) | As you choose (`recolorThumb`) |
| Single game, title size, lines, logo variant, zoom | On **Save** |
| Template (all cards) | On **Save** |
| Brand frame design | On **Save** |
| Flag, resolve, delete, rename, free pack | As you act |

Palette saves immediately in a panel where Title size does not. A designer
has no way to predict this, and the Save button does not tell them.

### 3.2 Save and Reset do not say what they cover

- The button reads "Save" or "Saved". It does not say what it will save. It
  can save the open game, the brand frame and the template in one press (C8).
- "Reset" or "Clear" depends on scope (line ~3542), so the same button means
  different things. Reset clears only the open layer, so after a Reset the
  button can still read "Save" because a different layer is dirty.
- "Saved" can show when a brand edit is already persisted, while the dirty
  check still compares against the catalogue row.

### 3.3 You cannot see the target

The target is named in small grey text in the sidebar ("Overriding X only",
"Editing the main template — applies to all"). The canvas and the grid give
no sign of it. With five possible targets, the wrong one is easy to hit. The
placement lock added this week is a good step; it is one control of many.

### 3.4 Navigation

- Ten filters with seven buttons to switch between them. Combined filters are
  not shown, so the grid can show a list you did not intend.
- A "Back" arrow (line ~1790) appears in single view. It sets the scope back to
  the template (`setScope('global')`) and does not clear the filters, so it does
  not necessarily return you to "all".
- The provider rail, the search box and the queue buttons all change the same
  grid, and nothing shows the active combination.

### 3.5 Destructive and confirmation UI

- Browser dialogs for flag notes and for the typed-count delete. They cannot
  be styled, are not keyboard-friendly, and the note is skippable with no
  reason given.
- Delete confirms, then removes the card before the database has answered
  (C2). The undo can then re-insert a card that was never deleted (C4).
- Undo covers delete, rename, recolour, bulk edit and flag. It does **not**
  cover placement, title size or logo, which are the most frequent edits. It
  is lost on reload.

### 3.6 Placement

- The Placement group is collapsed by default (line ~3113, `defaultOpen={false}`),
  though it is the control used most often.
- The new "Edit for all" switch is clear, but the locked state is shown by
  dimming the controls (`opacity-40`). A dimmed control with a message above
  it is readable; a dimmed control with no message would not be.

### 3.7 Accessibility and touch

- 47 inline click handlers, 17 `aria-label`s, 44 `title` tooltips. Tooltips do
  not appear on touch devices, so icon-only buttons with a `title` alone are
  unlabelled on a phone.
- Three keyboard handlers exist (two window listeners and one input). There are no shortcuts for common actions
  (nudge placement, next game, save) and no help overlay.
- The mobile layout uses a draggable bottom sheet and a 70% provider picker.
  I did not test it on a device. This needs a session on a real phone.

---

## 4. Plan

Each item has an acceptance check. Effort is a rough estimate for one
developer.

### Phase 0: stop losing work (about 2 days, low risk)

0.1 **One persistence helper.** `persist(write, { revert })` awaits the write,
checks the error, reverts local state on failure, and shows a sticky error
with Retry. Apply to C1, C2, C3, C5. *Check:* with the network off, change a
flag, a palette, an accent colour and a free-pack toggle. Each shows an error
and reverts to the saved value. Nothing reports success it did not get.

0.2 **Delete in the right order.** Await the database delete, then remove the
card. Push undo only after success. Make undo's re-insert conditional on the
row being absent. *Check:* delete with the network off leaves the card on
screen and reports the failure. Delete then undo restores it exactly once.

0.3 **Unsaved-changes guard.** `beforeunload` whenever any layer is dirty, and
a confirm when switching game, scope or brand with an unsaved layer. *Check:*
edit a template value, refresh: a warning appears. Edit a game, switch to
another game: the change is either saved or the user is asked.

0.4 **Brand bulk Save is a no-op.** On a brand, the edits are already
persisted, so Save should not write the catalogue row (C7). Guard the bulk
loop, and skip any id whose override is missing rather than writing `{}` (C6).
*Check:* bulk-edit five games on a brand, press Save: no preview is cleared
and no rebake is queued.

### Phase 1: one persistence model (about 4 days, needs a decision, see §5)

1.1 **Autosave overrides and layouts.** Every per-game edit, on any target,
is written as it is made, with a status indicator: "Saving…", "Saved", or
"Not saved — Retry". This removes the three-model problem for the common case.

1.2 **Keep an explicit Publish for the template.** It changes every card, so
it should remain deliberate. Show it as a bar when dirty: "Template changed —
affects 12,084 cards · Publish · Discard".

1.3 **Name the target on the button.** "Save this game", "Save brand frame",
"Publish template (12,084 cards)". Reset and Clear use the same name as the
layer they clear. *Check:* with the template dirty and one game open, the
button says the template is included, and Reset clears only what its label says.

### Phase 2: make the target explicit (about 4 days, after Phase 0)

2.1 **One target value.** Replace `scope`, `editingOne`, `editingBranch`,
`bulkMode` and the `onBranch` checks with a single
`target: { kind: 'template' | 'brand-frame' | 'game' | 'brand-game' | 'selection', ... }`
derived once, plus one `writeTo(target, patch)` used by every control. This is
the structural fix for the whole class of wrong-layer bugs.

2.2 **Show the target on the canvas.** A coloured chip above the grid:
green "This game", amber "Brand: beat.cc", red "All 12,084 cards". Clicking
the chip returns to the safe default.

2.3 **Shared resolver.** Put the four resolver copies (§3, the brand-override
bug) behind one `resolveCardParams(...)`. *Check:* a golden test asserts the
studio, bake, auto-republish and single render produce the same signature for
the same card.

### Phase 3: one view state (about 2 days)

3.1 Replace the ten flags with one `view` union:
`{ kind: 'all' } | { kind: 'provider', code } | { kind: 'search', q } | { kind: 'queue', name }`,
plus `branchOnly` as its own flag. One `setView`, so there are no hand-written
resets.

3.2 Show the active view as a dismissible bar above the grid: "Showing:
PRAGMATIC · Needs review ✕". *Check:* every combination the rail can produce
is shown, and clearing the bar returns to "all".

### Phase 4: performance (about 4 days, after measuring)

4.1 **Measure first.** React Profiler on 1,000 loaded tiles, recording each
slider step, toast and selection change. Record the numbers in the plan.

4.2 **Virtualise the grid.** Render the visible rows only.

4.3 **Memoise tiles and resolve once per change.** Compute resolved params
once per (target, version), not once per tile per render. `GridTile` takes
primitives plus a stable params reference, wrapped in `memo`.

4.4 **One store for games.** Replace the three arrays with a map by id plus
ordered id lists per view. `patchLocal` becomes one write.

### Phase 5: code health (about 1 week, start before Phases 1–4)

5.1 **Tests first.** Add Vitest and an `npm test` script. Write tests for: the
resolver (golden), `previewSig` stability (the Lines regression), the
persistence helper (revert on failure), the view reducer. Run in CI.

5.2 **Split the component.** Extract `GridPane`, `SidebarRail`, `EditorPanel`
(with its sections), `BulkBar`, `ExportPanel`, and the hooks `useEditTarget`,
`useSelection`, `useView`, `useUndo`. Target: no file above 800 lines.

5.3 **One set of UI primitives.** One `Section`, `Group`, `Row`, `Seg`,
`Toggle`, `Slider`, shared by the studio, Frames and Template editors.

5.4 **Delete dead code** after confirming it: `ClientOnboarding.tsx`,
`FrameBuilder.tsx`.

5.5 **Replace browser dialogs** with in-app dialogs: a note field for flags
(skippable, with the skip labelled), and a typed-count confirm for bulk
deletes.

5.6 **Undo, honestly.** Either cover the same set as autosave and survive a
reload, or label it "until you leave this page" and cover only what it
actually covers.

### Phase 6: experience polish (after the above)

6.1 Placement open by default; move Placement above Animation.
6.2 Keyboard: arrow keys nudge placement, Esc clears selection, next/previous
game, and a `?` overlay listing the shortcuts.
6.3 Labels: every icon-only button gets an `aria-label`; tooltips are not the
only label.
6.4 Mobile pass on a real device: the bottom sheet, the provider picker and
the placement controls.
6.5 Move the bake panel out of the editing sidebar into its own page or
drawer.

---

## 5. Decisions needed

1. **Autosave for per-game edits and layouts (recommended).** It removes most
   of the lost-work reports. The cost is that a half-finished edit is saved
   straight away. Undo would then need to cover the same set.
2. **Template changes stay explicit (recommended).** Keep a Publish step,
   because it changes every card.
3. **Undo: keep it in memory, or make it persistent?** In-memory is simpler and
   is what exists. Persistent undo across reloads is a larger change.
4. **Are `ClientOnboarding.tsx` and `FrameBuilder.tsx` still wanted?**
5. **Is the mobile studio a real workflow?** If designers only use desktop,
   Phase 6.4 can shrink.

---

## 6. Suggested order

1. **Phase 0 now.** Each item is small, and together they stop the reports of
   lost work.
2. **Phase 5.1 (tests) before anything structural.** Without it, the refactors
   in Phases 2–4 carry the same risk as the bugs they fix.
3. **Phases 1 and 2 together.** They share the same decision: one model, one
   explicit target.
4. **Phase 3**, then **Phase 4 after measuring**, not before.
5. **Phase 5.2 and 5.3** as the code is touched, not as a separate project.
6. **Phase 6** once the data and target behaviour is trustworthy.

## 7. What this review did not establish

- Rendering cost on the grid. Hypothesis, not measurement (§2.4).
- Mobile behaviour. Not tested on a device (§3.7).
- Whether `ClientOnboarding.tsx` and `FrameBuilder.tsx` are unused in the
  live build, as opposed to unused in `src/`.
- Whether the autosave cost (more writes) is acceptable to the database. The
  writes are small, but I did not measure the volume.
