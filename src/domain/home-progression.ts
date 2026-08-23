import type { HomeProgression } from "./types";

export const HOME_TIER_THRESHOLDS = [
  { tier: 1, minLevel: 1, name: "Starter Space" },
  { tier: 2, minLevel: 3, name: "Settled In" },
  { tier: 3, minLevel: 5, name: "Cozy Haven" },
  { tier: 4, minLevel: 8, name: "Adventurer’s Home" },
  { tier: 5, minLevel: 12, name: "HomeQuest Sanctuary" },
] as const;

export function homeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let current = 1; current < level; current += 1) total += 120 + (current - 1) * 60;
  return total;
}

export function getHomeLevelProgress(input: HomeProgression | number) {
  const totalXp = typeof input === "number" ? input : input.totalXp;
  let level = 1;
  while (totalXp >= homeXpForLevel(level + 1)) level += 1;
  const start = homeXpForLevel(level);
  const next = homeXpForLevel(level + 1);
  const tier = [...HOME_TIER_THRESHOLDS].reverse().find((item) => level >= item.minLevel)!;
  return { level, totalXp, xpIntoLevel: totalXp - start, xpNeeded: next - start, percent: Math.round(((totalXp - start) / (next - start)) * 100), tier: tier.tier, tierName: tier.name };
}
