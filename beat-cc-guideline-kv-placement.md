# The guideline key-visual band, as layout values

beat.cc renders through the `guideline` title system. That system carries its
own key-visual band, defined once in `CASINO_TOKENS.keyVisual`:

    top 0.0329 · height 0.8671 · sideInset 8/148 · anchorY 0.5

which is the spec in the type 1 / type 2 sheet: one fixed band, the artwork
contain-fitted into it and centred, its foot tucking behind the gradient so a
character (type 1) and a symbol (type 2) sit on the same line.

The band only decides the framing when a card has **no** crop of its own.
beat.cc's frame design holds a row at `148:209` — logo placement only — and
`branchParams` seeds any such row with the main template's own crop. So every
beat.cc card resolves to a crop, the band never runs, and a card nobody has
tuned inherits the template's 3:4 framing:

    kvAlign tc · kvScale 0.88 · kvDX -0.01 · kvDY +0.23

On a 3:4 card that is right. On beat.cc's taller 148:209 frame the +0.23 drops
the artwork into the text. That is what the 16 Avatar UX cards were showing.

## The band expressed as a crop

Writing the band's own geometry back as a crop puts a card where the guideline
says, whatever else resolves underneath it:

| value     | derivation                            | result      |
|-----------|---------------------------------------|-------------|
| `kvAlign` | band is centred in both axes          | `mc`        |
| `kvDX`    | band is symmetric about the centre    | `0`         |
| `kvScale` | `box.w / W` = `1 - 2 x 8/148`         | `0.891892`  |
| `kvDY`    | band centre `0.0329 + 0.8671/2` - 0.5 | `-0.03355`  |

`kvScale` is the band's width because a key visual is nearly always wider than
the frame's 148:209, so the contain-fit is width-bound. Artwork taller than
1:1.41 is height-bound and the band would fit it to `0.8671` instead — 2.9%
smaller. None of the 16 are that tall.

## Where this is NOT the same as the band

The band fits the **subject** — it reads the opaque bounding box and zooms so
the artwork's visible content fills the band, then pins that content's centre.
A crop fits the **whole PNG**, transparent padding included, and holds one
number for every card.

So these 16 now sit in an identical box, which is what was asked for. A card
whose PNG carries a wide transparent margin will read smaller inside that box
than one cropped tight, and wants a nudge on KV size. That is the same reason
the 80 already-approved Avatar UX cards carry 80 different scales: 17 of them
sit at `0.88`, which is this band at the slider's nearest step, and the rest
were zoomed in by hand from there.
