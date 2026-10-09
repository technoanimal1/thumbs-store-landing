# beat.cc — "vendor mapping or artwork needed" (618 games)

Checked all 618 identifiers against our catalogue on 9 Oct 2026.

**All 618 are already visible to our sync** — none are missing from the feed we
read, so this is purely about matching and artwork, not about us being blind to
them.

## Headline

| | count |
|---|---|
| Requested | 618 |
| Already servable today | 2 |
| **Can be served with a mapping only (artwork exists)** | **58** |
| Need artwork created | 558 |

## The important finding: 93% are individual live dealer tables

| Type | Count | We have artwork |
|---|---|---|
| Live blackjack tables | 382 | 9 |
| Live baccarat tables | 112 | 23 |
| Live roulette tables | 54 | 14 |
| Other live tables (craps, sic bo, top card…) | 17 | 1 |
| Lobby / navigation entries | 8 | 3 |
| **Distinct games (slots & show titles)** | **43** | **11** |

573 of the 616 outstanding are not games in the sense our pipeline means. They
are numbered dealer tables — *Blackjack Classic 18*, *Speed Baccarat Q*,
*Klasik Blackjack 12*, *Classic Bet Stacker Blackjack 26*. No provider ships
per-table key art or a per-table logotype, because the table is not a brand;
there are 382 blackjack tables and one Blackjack.

Eight more are not games at all: `evolution:blackjack`, `evolution:roulette_lobby`,
`evolution:rng`, `evolution:game_shows`, `evolution:top_games` and similar are
lobby tiles.

### What we suggest for the tables

One template per family — Blackjack, Baccarat, Roulette, Sic Bo — rendered with
the table name set as type, which our text-title system already does. That
covers all 573 in four designs rather than 573 commissions, and every table
gets a correct, on-brand, readable thumbnail. If beat.cc would rather show one
image for every blackjack table, that is four images total.

What we would not recommend is commissioning 382 pieces of artwork for tables
that differ only by number.

## Ready now — mapping only, no artwork needed (58)

Twelve of these are distinct games; the rest are tables whose names we already
carry. The game-level ones:

| Provider | beat.cc title | Our catalogue entry |
|---|---|---|
| BGaming | Golden Avalon Hold and Win | Golden Avalon Hold and Win |
| BGaming | Golden Paw Hold & Win | Golden Paw Hold & Win |
| BGaming | Road 2 Riches | Road 2 Riches |
| BGaming | Slot Machine | Slot Machine |
| BGaming | Winter Trophy Hold and Win | Winter Trophy Hold and Win |
| Pragmatic Play | Casino Hold'em | Casino Hold'em |
| Pragmatic Play | Dragon Tiger | Dragon Tiger |
| Pragmatic Play | Snakes & Ladders Live | Snakes & Ladders Live |
| Pragmatic Play | Sweet Bonanza Candyland | Sweet Bonanza CandyLand |
| Pragmatic Play | Treasure Island | Treasure Island |
| Pragmatic Play | Wild Gladiators | Wild Gladiators |
| Pragmatic Play | Oracle of Gold | *(matched, artwork incomplete)* |

## Genuinely need artwork — 46 distinct games

These are real titles with their own branding, and the only part of the 618
that warrants new design work.

**BGaming (7)** — Chicken Shot · Elements of Power · Fortuna TRUEWAYS ·
Fruit Million · Jogo Do Bicho Simple · Kicker Mania · Money Maker

**Evolution (11)** — Crazy Time A · Crazy Time Italia · Turkce Crazy Time ·
Extreme Texas Hold'em · First Person Craps · First Person Dragon Tiger ·
First Person Top Card · Red Baron 2 · Triple Card Poker · Ventuno Capri ·
Ventuno Positano

**Pragmatic Play (28)** — 777 Wheel Blitz · Better Barn House Bonanza ·
Bubble Up! · Candy Rush · Color Game Bonanza · Cosmic Clusters! ·
Death Dominion · Eastern Fury · Eternal Diamonds · Floating Dragon Hold&Spin ·
Floating Dragon New Year Festival Ultra Megaways Hold & Spin ·
Football Blitz Top Card · Football Blitz Top Card Latino ·
Gates of Olympus POP · Golden Retriever · Harvest Moon – Grave Profits ·
Hearts of Venus · Jade Legends · Lucky Drums 88 · Panda Fortune 2 ·
Privé Lounge Russian Poker · Ra vs Osiris · Snakes & Ladders 2 – Snake Eyes ·
Super Serge · The Amazing Money Machine · The Magic Cauldron – Enchanted Brew ·
Wolf Gold 1 000 000 · You Can Piggy Bank On It

## One mapping error worth flagging

`bgmng:SweetRushMegaways` is listed under the title **Sweet Royale Megaways**.
Those are two different games. Worth confirming which one the identifier is
meant to point at before anything is built for it.

## Suggested order of work

1. **Ship the 58 now** — mapping only, no design time.
2. **Agree the four table templates** — clears 573 in one decision.
3. **Commission the 46** — the only real artwork backlog here.

That turns "618 games blocked" into 46 pieces of work.
