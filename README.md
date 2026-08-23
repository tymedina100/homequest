# HomeQuest

HomeQuest is a mobile-first cozy home-management RPG. Milestone 0.5 turns useful household work into permanent, non-punitive progression: player XP, Home Levels and visual tiers, four skills with modest perks, achievements, cosmetic themes/decorations, and a once-daily deterministic chest.

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

Progression mutations are centralized in `src/domain/completion.ts`. Current home condition remains in `homeStats`; permanent home advancement is stored separately in `homeProgression`. Schema v4 migrates older local saves without clearing them.
