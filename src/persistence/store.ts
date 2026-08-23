import { toLocalDateKey } from "@/domain/dates";
import { createDefaultCollection } from "@/domain/cosmetics";
import { getSkillLevelProgress, perksForLevel } from "@/domain/skills";
import type { AppState, Progression, Quest, QuestCategory, QuestTemplate, SkillProgression } from "@/domain/types";

export interface HomeQuestPersistence {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  clear(): Promise<void>;
}

export const STORAGE_KEY = "homequest.save.v1";

function normalizedV1Quests(value: Record<string, unknown>): Quest[] | null {
  if (value.schemaVersion !== 1 || !Array.isArray(value.quests)) return null;
  return value.quests.map((quest) => {
    const legacy = quest as Quest;
    return {
      ...legacy,
      templateId: legacy.templateId ?? legacy.id,
      kind: legacy.kind ?? "normal",
      missedCount: legacy.missedCount ?? 0,
      escalation: legacy.escalation ?? (legacy.comebackEligible ? "rescue-eligible" : "non-escalating"),
      recurrence: legacy.recurrence?.cadence === "as-needed" ? legacy.recurrence : legacy.recurrence ?? { cadence: "manual" as const },
    };
  });
}

function templatesFromQuests(quests: Quest[]): QuestTemplate[] {
  const templates = new Map<string, QuestTemplate>();
  for (const quest of quests) {
    if (quest.kind === "rescue" || quest.kind === "comeback") continue;
    const id = quest.templateId ?? quest.id;
    if (templates.has(id)) continue;
    templates.set(id, {
      id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      estimatedMinutes: quest.estimatedMinutes,
      effort: quest.effort,
      recurrence: quest.recurrence ?? { cadence: "manual" },
      urgency: quest.urgency,
      escalation: quest.escalation ?? "non-escalating",
      statEffects: quest.statEffects,
      active: true,
      createdAt: quest.createdAt,
      updatedAt: quest.lastCompletedAt ?? quest.createdAt,
      rewardMode: "manual",
      manualXpReward: quest.xpReward,
      recommendation: quest.recommendation,
    });
  }
  return [...templates.values()];
}

function migrateV2(value: Record<string, unknown>, now: Date): Record<string, unknown> | null {
  if (value.schemaVersion !== 2 || !Array.isArray(value.quests)) return null;
  const quests = value.quests as Quest[];
  const date = toLocalDateKey(now);
  return {
    ...value,
    schemaVersion: 3,
    quests,
    questTemplates: templatesFromQuests(quests),
    dailyContext: { date, energy: "good", availableMinutes: 15 },
  };
}

function skillsFromProgression(progression: Progression): SkillProgression {
  const categories: QuestCategory[] = ["cleaning", "cooking", "organization", "homekeeping"];
  return Object.fromEntries(categories.map((category) => {
    const legacy = progression.categoryStats[category] ?? { xp: 0, completed: 0 };
    return [category, { totalXp: legacy.xp, completedQuestCount: legacy.completed, unlockedPerkIds: perksForLevel(category, getSkillLevelProgress(legacy.xp).level) }];
  })) as SkillProgression;
}

function migrateV3(value: Record<string, unknown>, now: Date): AppState | null {
  if (value.schemaVersion !== 3 || !value.progression || !Array.isArray(value.quests)) return null;
  const progression = value.progression as Progression;
  const legacyAchievements = Array.isArray(value.achievements) ? value.achievements as Array<Record<string, unknown>> : [];
  const achievements = legacyAchievements.filter((item) => item.unlocked === true || typeof item.unlockedAt === "string").map((item) => ({ id: String(item.id), unlockedAt: typeof item.unlockedAt === "string" ? item.unlockedAt : now.toISOString() }));
  const cosmetics = createDefaultCollection();
  const starterIds = new Set(["dishwasher", "dinner", "counters", "trash", "laundry"]);
  const questTemplates = Array.isArray(value.questTemplates) ? (value.questTemplates as QuestTemplate[]).map((template) => ({ ...template, source: template.source ?? (starterIds.has(template.id) ? "starter" as const : "user" as const) })) : [];
  if (achievements.some((item) => item.id === "first-step")) { cosmetics.ownedIds.push("title-little-things"); cosmetics.equippedTitleId = "title-little-things"; }
  return { ...(value as unknown as Omit<AppState, "schemaVersion" | "homeProgression" | "skills" | "achievements" | "cosmetics" | "dailyChest">), schemaVersion: 4, questTemplates, homeProgression: { totalXp: progression.totalXp }, skills: skillsFromProgression(progression), achievements, cosmetics, dailyChest: { date: toLocalDateKey(now), qualifyingQuestIds: [], status: "locked" } };
}

export class LocalStoragePersistence implements HomeQuestPersistence {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {}

  async load(): Promise<AppState | null> {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      if (value.schemaVersion === 4) return value as unknown as AppState;
      if (value.schemaVersion === 3) return migrateV3(value, new Date());
      const v1Quests = normalizedV1Quests(value);
      const v3 = v1Quests ? migrateV2({ ...value, schemaVersion: 2, quests: v1Quests, lifecycle: { dailyHistory: [], questHistory: [] } }, new Date()) : migrateV2(value, new Date());
      return v3 ? migrateV3(v3, new Date()) : null;
    } catch {
      return null;
    }
  }

  async save(state: AppState): Promise<void> {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    this.storage.removeItem(STORAGE_KEY);
  }
}
