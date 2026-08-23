# HomeQuest

HomeQuest is a mobile-first cozy home-management RPG. Milestone 0.6 adds a shared household for Tyler and Rachel while preserving separate, non-punitive player journeys: XP, skills, achievements, coins, titles, daily context, Daily Chests, and customizable chibi characters.

## Run locally

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Validation

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture

- `src/domain`: framework-free quest, progression, recommendation, and meal logic
- `src/persistence`: versioned persistence interface and local-storage adapter
- `src/data`: immediately useful seed state and deterministic recipes
- `src/state`: React state orchestration and persistence lifecycle
- `src/views`: feature-level screens
- `src/components`: reusable application and UI components

The app includes an App Router web manifest and install metadata. A production service worker/offline asset strategy is intentionally deferred until the caching policy is defined.

Progression mutations are centralized in `src/domain/completion.ts`. Schema v5 cleanly separates shared `household` state (quests, inventory, home condition/progression, lifecycle, themes, and decorations) from stable-ID `players`. Every completion requires an acting player ID and records attribution in both the occurrence and shared history. The v4→v5 migration assigns existing personal progress and history to Tyler, creates a fresh Rachel profile, and preserves the existing local-storage key without clearing saves.
