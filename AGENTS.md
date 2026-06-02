# chatcat

**Chatcat** is basically an incremental game but also a chat where chat messages disappear, but the chat messages inform how the game progresses.

The goal of this project is to make something fun.

## Commands

```sh
bun run dev           # start dev server
bun run build         # production build
bun run check         # svelte-kit sync + svelte-check (run this before committing)
```

## Tech

- **SvelteKit 2 + Svelte 5** — runes mode forced (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **Bun** runtime and package manager
- **Tailwind CSS v4** — config via `@theme` in `src/routes/layout.css` (no `tailwind.config.js`)
- **Valibot** — runtime schema validation in remote functions
- **svelte-adapter-bun** — deploy as standalone Bun server. Patched locally via `bun patch` to add `/^bun:/` to rolldown externals (needed for `bun:sqlite`). Re-run `bun patch svelte-adapter-bun` if node_modules is reinstalled.

## Architecture

- All server logic lives in `src/routes/**/*.remote.ts` files using `query`, `query.live`, and `form` from `$app/server`. There are **no `+server.ts` or `+page.server.ts` files** anywhere.
- Data flows: client calls `query.live` (async generator) → server yields data → suspends on `Promise.withResolvers()` → `form` handler resolves to push updates.
- Messages are ephemeral (15s TTL, in-memory array). Stats (message count, character count) persist via `bun:sqlite` at `data/chatcat.db`.
- DB migrations run once at startup in `src/hooks.server.ts` via `migrate()` from `$lib/server/db`. Always use `pragma_table_info` to check column existence — Bun's SQLite does **not** support `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- Two routes: `/` (name entry) → navigates to `/chat?name=...`.
- Theme: Catppuccin Mocha. Custom color tokens are `mocha-*` (e.g. `mocha-base`, `mocha-mauve`, `mocha-surface-0`). Use these Tailwind classes directly.

## Conventions

- Components go in `src/lib/components/`.
- Server-only modules go in `src/lib/server/` (enforced by SvelteKit).
- Use `$lib` alias for `src/lib/` imports.
- Use the existing components (`Button`, `Input`, `Message`, `Error`) instead of raw HTML for consistency.
- When adding a new remote function, export it from the `.remote.ts` file and import it on the client with the same name.
