import type { QuestCategory, QuestTemplate, QuestZoneId, ZoneEffects } from "./types";

const KITCHEN_TEMPLATE_IDS = new Set(["dishwasher", "dinner", "counters", "trash"]);
const BATHROOM_TEMPLATE_IDS = new Set(["bathroom-reset", "bathroom-supplies", "clean-bathroom"]);

export function inferQuestZone(input: Pick<QuestTemplate, "id" | "category">): QuestZoneId {
  if (BATHROOM_TEMPLATE_IDS.has(input.id)) return "bathroom";
  if (KITCHEN_TEMPLATE_IDS.has(input.id) || input.category === "cooking") return "kitchen";
  return "household";
}

export function defaultZoneEffects(templateId: string, category: QuestCategory, zoneId: QuestZoneId): ZoneEffects | undefined {
  const byTemplate: Record<string, ZoneEffects> = {
    dishwasher: { dishes: 20, counters: 4 },
    dinner: { food: 14, counters: -3, dishes: -2 },
    counters: { counters: 18 },
    trash: { trash: 22 },
    "bathroom-reset": { sink: 14, toilet: 16, shower: 12, floor: 10 },
    "bathroom-supplies": { supplies: 22 },
    "clean-bathroom": { sink: 16, toilet: 18, shower: 12, floor: 12 },
  };
  if (byTemplate[templateId]) return byTemplate[templateId];
  if (zoneId === "kitchen" && category === "cooking") return { food: 10, counters: -2, dishes: -2 };
  if (zoneId === "bathroom" && category === "cleaning") return { sink: 10, toilet: 10, floor: 6 };
  return undefined;
}

export function withZoneMetadata<T extends { id: string; category: QuestCategory; zoneId?: QuestZoneId; zoneEffects?: ZoneEffects }>(value: T): T & { zoneId: QuestZoneId } {
  const zoneId = value.zoneId ?? inferQuestZone(value as Pick<QuestTemplate, "id" | "category">);
  return { ...value, zoneId, zoneEffects: zoneId === "household" ? undefined : value.zoneEffects ?? defaultZoneEffects(value.id, value.category, zoneId) };
}
