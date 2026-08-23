import type { KitchenCondition, QuestCategory, QuestTemplate, QuestZoneId } from "./types";

const KITCHEN_TEMPLATE_IDS = new Set(["dishwasher", "dinner", "counters", "trash"]);

export function inferQuestZone(input: Pick<QuestTemplate, "id" | "category">): QuestZoneId {
  if (KITCHEN_TEMPLATE_IDS.has(input.id) || input.category === "cooking") return "kitchen";
  return "household";
}

export function defaultKitchenEffects(templateId: string, category: QuestCategory): Partial<KitchenCondition> | undefined {
  const byTemplate: Record<string, Partial<KitchenCondition>> = {
    dishwasher: { dishes: 20, counters: 4 },
    dinner: { food: 14, counters: -3, dishes: -2 },
    counters: { counters: 18 },
    trash: { trash: 22 },
  };
  if (byTemplate[templateId]) return byTemplate[templateId];
  if (category === "cooking") return { food: 10, counters: -2, dishes: -2 };
  return undefined;
}

export function withZoneMetadata<T extends { id: string; category: QuestCategory; zoneId?: QuestZoneId; zoneEffects?: Partial<KitchenCondition> }>(value: T): T & { zoneId: QuestZoneId } {
  const zoneId = value.zoneId ?? inferQuestZone(value as Pick<QuestTemplate, "id" | "category">);
  return { ...value, zoneId, zoneEffects: zoneId === "kitchen" ? value.zoneEffects ?? defaultKitchenEffects(value.id, value.category) : undefined };
}
