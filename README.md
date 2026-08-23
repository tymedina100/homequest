# HomeQuest

HomeQuest is a mobile-first cozy home-management RPG. Milestone 0.8 adds the Kitchen as the first persistent Home Zone while preserving separate, non-punitive player journeys for Tyler and Rachel.

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

Progression mutations are centralized in `src/domain/completion.ts`. Schema v6 cleanly separates shared `household` state (quests, inventory, home condition/progression, zones, lifecycle, themes, and decorations) from stable-ID `players`. Every completion requires an acting player ID and records attribution in both the occurrence and shared history. The migration chain preserves the existing local-storage key and derives the Kitchen from v5 Home condition without clearing saves.

The reusable zone boundary lives in `src/domain/zones.ts`; only Kitchen is active. Kitchen Harmony weights Dishes (25%) and Food (24%) most heavily because they most directly affect whether the room is usable, followed by Counters (21%), Trash (17%), and Floor (13%). Condition is clamped and may ebb through lifecycle updates, while Kitchen XP, Level, tiers, and earned decorations are permanent.

Kitchen decorations are household-owned and equipped in predetermined room slots. Purchases use the acting player’s personal coins, then become visible to every household member. HomeQuest intentionally does not introduce a household bank in this milestone.
