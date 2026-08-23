import type { HomeStats, KitchenCondition, KitchenConditionKey, Quest, ZoneState } from "./types";

export const KITCHEN_ZONE_ID = "kitchen" as const;
export const CONDITION_MIN = 0;
export const CONDITION_MAX = 100;

/** Dishes and food have the most day-to-day effect on whether the room is usable. */
export const KITCHEN_HARMONY_WEIGHTS: Record<KitchenConditionKey, number> = {
  dishes: 0.25,
  food: 0.24,
  counters: 0.21,
  trash: 0.17,
  floor: 0.13,
};

export const KITCHEN_TIERS = [
  { level: 1, tier: 1, name: "Basic Kitchen" },
  { level: 3, tier: 2, name: "Settled Kitchen" },
  { level: 5, tier: 3, name: "Cozy Kitchen" },
  { level: 8, tier: 4, name: "Cook’s Corner" },
  { level: 12, tier: 5, name: "Hearth & Home" },
] as const;

export interface ZoneLevelProgress {
  level: number;
  tier: number;
  tierName: string;
  totalXp: number;
  xpIntoLevel: number;
  xpNeeded: number;
  percent: number;
}

export function clampCondition(value: number): number {
  return Math.max(CONDITION_MIN, Math.min(CONDITION_MAX, Math.round(Number.isFinite(value) ? value : 0)));
}

export function normalizeKitchenCondition(condition: Partial<KitchenCondition>): KitchenCondition {
  return {
    dishes: clampCondition(condition.dishes ?? 50),
    counters: clampCondition(condition.counters ?? 50),
    floor: clampCondition(condition.floor ?? 50),
    trash: clampCondition(condition.trash ?? 50),
    food: clampCondition(condition.food ?? 50),
  };
}

export function calculateKitchenHarmony(condition: KitchenCondition): number {
  return clampCondition((Object.keys(KITCHEN_HARMONY_WEIGHTS) as KitchenConditionKey[])
    .reduce((total, key) => total + condition[key] * KITCHEN_HARMONY_WEIGHTS[key], 0));
}

export function seedKitchenCondition(homeStats: HomeStats): KitchenCondition {
  const { kitchen, cleanliness, organization, supplies } = homeStats;
  return normalizeKitchenCondition({
    dishes: kitchen * 0.65 + cleanliness * 0.35,
    counters: kitchen * 0.6 + cleanliness * 0.25 + organization * 0.15,
    floor: cleanliness * 0.7 + organization * 0.3,
    trash: cleanliness * 0.6 + organization * 0.4,
    food: supplies * 0.7 + kitchen * 0.3,
  });
}

export function zoneXpNeededForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return 40 + (safe - 1) * 20 + Math.floor((safe - 1) / 3) * 10;
}

export function zoneXpAtLevel(level: number): number {
  let total = 0;
  for (let current = 1; current < Math.max(1, Math.floor(level)); current += 1) total += zoneXpNeededForLevel(current);
  return total;
}

export function getZoneLevelProgress(totalXp: number): ZoneLevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let threshold = zoneXpNeededForLevel(level);
  let spent = 0;
  while (safeXp >= spent + threshold) {
    spent += threshold;
    level += 1;
    threshold = zoneXpNeededForLevel(level);
  }
  const tier = [...KITCHEN_TIERS].reverse().find((entry) => level >= entry.level) ?? KITCHEN_TIERS[0];
  const xpIntoLevel = safeXp - spent;
  return { level, tier: tier.tier, tierName: tier.name, totalXp: safeXp, xpIntoLevel, xpNeeded: threshold, percent: Math.round((xpIntoLevel / threshold) * 100) };
}

export function calculateKitchenQuestXp(quest: Quest): number {
  if (quest.zoneId !== KITCHEN_ZONE_ID || quest.status !== "available") return 0;
  const effort = quest.effort === "high" ? 6 : quest.effort === "medium" ? 3 : 0;
  const time = Math.min(10, Math.floor(quest.estimatedMinutes / 5) * 2);
  const kind = quest.kind === "rescue" ? 6 : 0;
  return 6 + effort + time + kind;
}

export function applyKitchenEffects(condition: KitchenCondition, effects: Partial<KitchenCondition> = {}): KitchenCondition {
  return normalizeKitchenCondition(Object.fromEntries((Object.keys(condition) as KitchenConditionKey[])
    .map((key) => [key, condition[key] + (effects[key] ?? 0)])) as Partial<KitchenCondition>);
}

export function decayKitchenCondition(condition: KitchenCondition, elapsedDays: number): KitchenCondition {
  const days = Math.max(0, Math.floor(elapsedDays));
  if (!days) return condition;
  return applyKitchenEffects(condition, {
    dishes: -2 * days,
    counters: -days,
    floor: -Math.floor((days + 1) / 2),
    trash: -2 * days,
    food: -days,
  });
}

export function createKitchenZone(homeStats: HomeStats, totalXp = 0, initializedFromSchema = 6): ZoneState {
  return {
    id: KITCHEN_ZONE_ID,
    displayName: "Kitchen",
    type: "kitchen",
    totalXp: Math.max(0, Math.floor(totalXp)),
    condition: seedKitchenCondition(homeStats),
    cosmetics: { equippedDecorationIds: {} },
    metadata: { initializedFromSchema },
  };
}

export function conditionLabel(value: number): "Needs attention" | "Watch" | "Okay" | "Good" | "Great" {
  if (value < 35) return "Needs attention";
  if (value < 50) return "Watch";
  if (value < 65) return "Okay";
  if (value < 82) return "Good";
  return "Great";
}

export function weakestKitchenConditions(condition: KitchenCondition, limit = 2): KitchenConditionKey[] {
  const order: KitchenConditionKey[] = ["dishes", "food", "counters", "trash", "floor"];
  return [...order].sort((left, right) => condition[left] - condition[right] || order.indexOf(left) - order.indexOf(right)).slice(0, limit);
}
