import type { HomeStats } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function applyHomeStatEffects(stats: HomeStats, effects: Partial<HomeStats>): HomeStats {
  return {
    cleanliness: clamp(stats.cleanliness + (effects.cleanliness ?? 0)),
    organization: clamp(stats.organization + (effects.organization ?? 0)),
    supplies: clamp(stats.supplies + (effects.supplies ?? 0)),
    kitchen: clamp(stats.kitchen + (effects.kitchen ?? 0)),
  };
}
