# Maxxed — key visual reframing (23 Oct 2026)

## What you reported
Two Maxxed thumbnails side by side: **Zeus's Lightning Blaze** framed well, **Biggest Vault**
small and floating in the middle of the card.

## What the difference actually was
Not the size — the **anchor**.

| | anchor | scale | vertical offset |
|---|---|---|---|
| Zeus's Lightning Blaze (good) | `bc` — bottom-centre | 1.08 | −0.12 (lifted) |
| Biggest Vault (bad) | `mc` — middle-centre | 1.06 | **+0.16 (pushed down)** |

Zeus has a hand-tuned per-game crop. **Biggest Vault has none at all** — it was falling back to
the main template default, which is middle-anchored and pushed *down*. That default is the
floating look, and it was never a Maxxed decision; Maxxed's frame design carried nothing but
`logoVariant: white`.

## Population (4,394 Maxxed games)

| | count | state |
|---|---|---|
| No crop at all → template default (the bad look) | **2,330** | **fixed** |
| Hand-tuned, middle anchor, lifted | 1,750 | left alone |
| Hand-tuned, middle anchor, still low | 260 | left alone — see below |
| Hand-tuned, bottom/top anchor | 53 | left alone (Zeus is one) |

## The fix
Maxxed's **branch frame design** now sets the Zeus framing as its default:

```json
"layouts": { "3:4": { "kvAlign": "bc", "kvScale": 1.08, "kvDX": 0, "kvDY": -0.12 } }
```

Done at the branch level on purpose, which gives three things:

1. **All 2,330 untouched games inherit it at once** — no per-game writes.
2. **Every hand-tuned crop survives.** The bake composes branch frame first, per-game override
   last, so the designer's 2,063 tuned games keep exactly what she set.
3. **No other client is touched.** Per-game crops live on the *shared* thumbnail record and
   carry across frame sizes, so writing 2,330 of those would have moved **730 games inside
   beat.cc's live 3,508-game feed** as well. The branch frame is per-branch and cannot leak.

## The 260 I did not touch
Hand-tuned, middle-anchored, still sitting low (`kvDY` ≥ 0.10) — but nearly all with large
crops (scale 1.2–2.6). A big crop pushed down is a deliberate bleed off the bottom edge, which
reads differently from Biggest Vault's small centred float. They're the designer's own work, so
they stay. Say the word if you want them re-anchored too; that one has to be branch-scoped
per-thumbnail to stay off beat.cc.

## Code fix that went with it
`RenderOne` (the headless target behind the Studio's export button) and the Frames editor
preview were composing the layers in the **reverse** order to the bake — branch frame last,
over the top of each game's own crop. Harmless while Maxxed's frame set no key-visual values;
the moment it did, both would have flattened all 2,063 hand-tuned games. Both now match the
bake. Shipped in `thumbs-store-dashboard@5740a29`.

## To go live
Re-bake Maxxed. A changed-only bake re-renders just the ~2,330 affected of the 4,390 baked
white files; the rest are signature-identical and get skipped.
