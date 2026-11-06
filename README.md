# FGOlike ✦ Grand Order Roguelike

A web roguelike with the map structure of [pokelike.xyz](https://pokelike.xyz) and the command-card combat of *Fate/Grand Order*.
Clear the 7 Singularities and Solomon's Temple, summon Servants on Summon nodes, level up, ascend, collect Craft Essences and defeat every boss.

> Non-profit fan game. *Fate/Grand Order* © TYPE-MOON / FGO PROJECT. Game data from [Atlas Academy](https://atlasacademy.io). No official art is included.

## Getting started

```bash
npm install
npm run import:atlas   # downloads every JP Servant from Atlas Academy (needs internet, ~1 min)
npm run dev            # http://localhost:5173
```

Other scripts:

```bash
npm test               # engine tests (vitest)
npm run typecheck
npm run build          # production build in dist/
npm run simulate -- 100 -v   # plays 100 runs with a bot to check balance
npm run import:atlas -- --fresh   # re-download (the cache lasts 24h)
```

Requires Node 20.19+ (or 22+).

### Servant data

`npm run import:atlas` reads `nice_servant_lang_en.json` and `NiceClassRelation.json` from the Atlas Academy JP export and writes:

- `src/data/generated/servants.json` — every playable JP Servant with **strengthened skills** (the highest-priority version of each skill), class passives, NP1→NP5 multipliers, hit counts, star absorption, NP gain…
- `src/data/generated/classRelation.json` — the exact class affinity table (incl. Alter Ego, Moon Cancer, Foreigner, Pretender, Beast).

Commit both files so GitHub Pages builds include them. Until you run the import, the game uses a small hand-made fallback roster (`src/data/fallbackServants.ts`).

FGO effects are mapped onto FGOlike's simplified effect system (`scripts/atlas/convert.mjs`). Unsupported effects (special attack vs traits, debuff resist, etc.) are ignored; the import prints a summary of what was skipped.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite** | Instant dev server, static build for GitHub Pages |
| Language | **TypeScript** (strict) | Lots of rules and data |
| UI | **React 19** | Menus, map and cards are UI state, not a canvas |
| State | Tiny store on `useSyncExternalStore` | Each action clones the run → mutates → saves |
| Persistence | `localStorage` | Autosave after every action; seeded RNG saved in the run |
| Tests | **Vitest** | The engine is pure TS, tested without a browser |

## Structure

```
src/
  game/                 Pure engine (no React)
    types.ts            Core types
    constants.ts        FGO values: cards, classes, affinities, level curves
    effects.ts          Skill/NP level scaling and generated rules text
    rng.ts              Seeded RNG (mulberry32)
    combat/
      damage.ts         Damage, NP gain and star formulas
      battle.ts         Turn state machine: queued steps, chains, enemy AI, boss phases
      factory.ts        Units (skills by level, passives, Craft Essences) and encounters
    map/generator.ts    Fixed diamond map (1-2-3-4-3-4-3-2-1)
    progression/        Levels, ascension, summoning
    run.ts              Run flow: nodes, rewards, resources
    save.ts
  data/
    generated/          Atlas Academy import output
    fallbackServants.ts Hand-made roster used before the import
    servants.ts         Roster loader
    enemies.ts          Enemies, elites and the 8 bosses (with phases)
    craftEssences.ts    Curated Craft Essences
    singularities.ts    The 8 Singularities
    mysticCodes.ts      Chaldea Uniform
  store/gameStore.ts
  ui/
    components/         HUD, original class icons (SVG), portraits, party panel…
    screens/            Title, map, battle, summon, rest, rewards…
scripts/
  import-atlas.mjs      Atlas Academy importer
  atlas/convert.mjs     Atlas "nice" → FGOlike conversion
  simulate.ts           Headless balance simulator
```

## Mechanics

- **Map**: same diamond shape in every Singularity; node types are re-rolled. Row 1 always offers a Summon, the row before the boss is always Rest, and there is at least one Elite in the second half.
- **Summon**: 3 random Servants (rarity first, then Servant; 4★/5★ get likelier), pick 1. Duplicate → **NP level +1**. Rarely, a **Command Seal** answers the summon.
- **Combat**: 15-card deck, 5-card hand, pick 3. First-card bonus, Buster/Arts/Quick Chain, Mighty Chain, Brave Chain + Extra Attack, critical stars by absorption, Overcharge, class & attribute affinity, enemy charge gauge, waves, automatic substitution. Each card resolves one by one with animations (1×/2×/4× speed, Space to skip).
- **Bosses** have several HP bars: breaking one triggers a new phase (buffs, more actions, charged NP).
- **Resources**: Command Seals (3) never regenerate. Mystic Code skills: once per Singularity. Half of the NP gauge (max 50%) carries over between battles.
- **Craft Essences**: dropped by Elites, bosses and treasures (choose 1 of 3); one per Servant; flat ATK/HP + battle-start effects.
- **Progression**: EXP and level caps 20/40/60/80/90; **Ascension** with Crystals ◆ unlocks the 2nd/3rd skill, then boosts stats. Skill level grows with the Servant's level (Lv 90 = skill level 10).

## Roadmap

1. Trait and class synergies (e.g. 2+ Sabers, Knights of the Round Table).
2. More Mystic Codes (unlockable between runs).
3. Real art in `public/portraits/<id>.png`.
4. Special attack vs traits from Atlas data.
5. Daily seeded runs and difficulty levels after a win.

## Deploy

`.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages on every push to `main`
(enable *Settings → Pages → Source: GitHub Actions*).
