# Chatcat — Multiplayer Incremental Chat Game

## Concept

An incremental game where the core mechanic is chatting. Every message and character
sent earns points. When the group collectively crosses a points milestone, a vote
unlocks — pick an upgrade that changes the rules for everyone.

## Core Loop

1. User enters name → joins chat room
2. Every message = **10 pts**, every character = **1 pt**
3. When total points cross the next milestone (every 500 pts), a **vote round** begins
4. 3 upgrade options appear for 20 seconds — everyone votes
5. Winning upgrade activates (30s duration, stacking with previous upgrades)
6. Loop continues, next milestone scales

## Architecture

All game state flows through the same `query.live` / `form` pattern already used for
chat. No `+server.ts` or `+page.server.ts`.

- **Persistent** (SQLite): points, message count, character count
- **In-memory** (server): vote state, active upgrades, timers, messages
- **Real-time** (same `Promise.withResolvers()` pattern): game state pushed to all
  clients whenever chat or vote events happen

## Module Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── button.svelte          (existing)
│   │   ├── input.svelte           (existing)
│   │   ├── message.svelte          (existing)
│   │   ├── error.svelte           (existing)
│   │   ├── dialog.svelte          (Phase 2 — native <dialog> wrapper)
│   │   └── particleBurst.ts       (existing)
│   ├── server/
│   │   ├── db.ts                  (SQLite — queries, migrations)
│   │   ├── game.ts                (point calculation, milestone math, upgrade defs)
│   │   └── voting.ts              (vote round management — start, tally, expire)
│   └── types.ts                   (shared TS interfaces — GameState, VoteState, etc.)
├── routes/
│   └── chat/
│       ├── +page.svelte           (UI — imports components, binds to live queries / forms)
│       └── chat.remote.ts         (thin API layer — imports server modules, wires query.live + form)
└── hooks.server.ts                (runs migrate on startup)
```

## Coding Conventions

1. **Pure functions, no classes** — every server module exports plain functions
   (e.g. `calculatePoints(text, activeUpgrades) => number`). Data in, data out.

2. **Small public API** — each module exposes 2–5 exports max. The rest stays
   module-private.

3. **`chat.remote.ts` stays thin** — it imports server modules and wires them into
   live queries and forms. No business logic lives here.

4. **State lives with its owner** — vote state in `voting.ts`, active upgrades in
   `game.ts`, DB in `db.ts`. Module-level variables + `notify()` pattern as before.

5. **Components are dumb** — props in, HTML out. Never import from `$lib/server/`.
   Form/live-query bindings go in the route page, not in components.

6. **Same patterns as existing code** — Valibot for form validation, `query.live`
   for streaming state, `form` for mutations. No `+server.ts` or `+page.server.ts`.

## Data Model

### SQLite (`message_count` table — extended)

| Column | Type | Purpose |
|---|---|---|
| `id` | INTEGER | always 1 (singleton row) |
| `count` | INTEGER | total messages sent |
| `total_characters` | INTEGER | total characters sent |
| `total_points` | INTEGER | cumulative points earned |

### In-memory state (`chat.remote.ts`)

```ts
interface VoteState {
  active: boolean
  options: UpgradeOption[]
  endsAt: number  // timestamp
  votes: Record<string, number>  // sender -> option index
  winner: number | null
}

interface UpgradeOption {
  id: string
  name: string
  description: string
}

interface ActiveUpgrade {
  id: string
  expiresAt: number
}

interface GameState {
  messages: number
  characters: number
  points: number
  nextMilestone: number
  vote: VoteState | null
  activeUpgrades: ActiveUpgrade[]
}
```

---

## Implementation Phases

### Phase 1 — Points Engine

- [ ] Add `total_points` column to SQLite (via migration in `hooks.server.ts`)
- [ ] On every `sendMessages`, calculate points and persist
- [ ] Expose `getGameState` live query returning `GameState` (points, stats, next milestone)
- [ ] Replace `getMessageCount` usage in sidebar with `getGameState` — show points + stats
- [ ] **No voting or upgrades yet** — just the backend plumbing visible in the UI

### Phase 2 — Voting

- [ ] In-memory `VoteState` variable in `chat.remote.ts`
- [ ] After `incrementStats` in `sendMessages`, check if points crossed the next milestone
- [ ] If so, generate 3 random `UpgradeOption`s and start a vote round (20s timer)
- [ ] `vote` form handler — accepts `sender + optionIndex`, records vote
- [ ] On timer expiry (or all users voted), pick winner, clear vote
- [ ] Native `<dialog>` component (`src/lib/components/dialog.svelte`) wrapping `<dialog>`
- [ ] Vote UI in `+page.svelte` — renders when `vote.active`, shows options + countdown + live results
- [ ] Sidebar shows current milestone progress with a bar

### Phase 3 — Upgrades

- [ ] Upgrade effect system — each upgrade has a `modifyPoints(base: number) => number` and `onActivate()` callback
- [ ] `ActiveUpgrade` array in memory with expiry timestamps
- [ ] Point calculation in `sendMessages` applies active upgrade modifiers
- [ ] First 6 upgrades:

| Upgrade | Effect | Duration |
|---|---|---|
| Double Time | 2× points | 30s |
| Vowel Power | Vowels (`aeiou`) count as 2 pts each | 30s |
| Bonus Points | Instant +200 points | instant |
| Per Minute | +0.1 pts per character | 30s |
| Cat Spam | 100 "meow" messages flood into chat (count toward stats) | instant |
| Long Word Bonus | Words ≥6 letters give +10 bonus pts | 30s |

- [ ] Sidebar shows active upgrades with remaining time

### Phase 4 — Polish

- [ ] Cat spamming animation (particle burst for each "meow"?)
- [ ] Vote result announcement animation
- [ ] Tie-breaking (random option wins)
- [ ] Handle user disconnect during vote (just let timer expire)
- [ ] Milestone scaling (e.g., each milestone is `500 * milestoneIndex` or similar)
- [ ] Sound effects? (stretch goal)
