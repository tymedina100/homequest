import { normalizeAvatar, defaultAvatarFor } from "@/domain/avatar";
import { COSMETICS, createDefaultCollection, createDefaultHouseholdCollection } from "@/domain/cosmetics";
import { toLocalDateKey } from "@/domain/dates";
import { HOUSEHOLD_ID, RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "@/domain/players";
import { getSkillLevelProgress, perksForLevel } from "@/domain/skills";
import type { AchievementState, AppState, CosmeticCollection, DailyChestState, DailyContext, DailyLifecycleState, HomeProgression, HomeStats, InventoryItem, PlayerState, Progression, Quest, QuestCategory, QuestTemplate, SkillProgression, UserPreferences } from "@/domain/types";

export interface HomeQuestPersistence { load(): Promise<AppState | null>; save(state: AppState): Promise<void>; clear(): Promise<void> }
export const STORAGE_KEY = "homequest.save.v1";

interface LegacyV4State {
  schemaVersion: 4;
  player: { name: string; coins: number };
  quests: Quest[]; questTemplates: QuestTemplate[]; homeStats: HomeStats; inventory: InventoryItem[];
  progression: Progression; homeProgression: HomeProgression; skills: SkillProgression;
  achievements: AchievementState[]; cosmetics: CosmeticCollection; dailyChest: DailyChestState;
  preferences: UserPreferences & { energy?: string; availableMinutes?: number };
  dailyContext: DailyContext; lifecycle: DailyLifecycleState;
}

function normalizedV1Quests(value: Record<string, unknown>): Quest[] | null {
  if (value.schemaVersion !== 1 || !Array.isArray(value.quests)) return null;
  return value.quests.map((quest) => {
    const legacy = quest as Quest;
    return { ...legacy, templateId: legacy.templateId ?? legacy.id, kind: legacy.kind ?? "normal", missedCount: legacy.missedCount ?? 0, escalation: legacy.escalation ?? (legacy.comebackEligible ? "rescue-eligible" : "non-escalating"), recurrence: legacy.recurrence?.cadence === "as-needed" ? legacy.recurrence : legacy.recurrence ?? { cadence: "manual" as const } };
  });
}

function templatesFromQuests(quests: Quest[]): QuestTemplate[] {
  const templates = new Map<string, QuestTemplate>();
  for (const quest of quests) {
    if (quest.kind === "rescue" || quest.kind === "comeback") continue;
    const id = quest.templateId ?? quest.id; if (templates.has(id)) continue;
    templates.set(id, { id, title: quest.title, description: quest.description, category: quest.category, estimatedMinutes: quest.estimatedMinutes, effort: quest.effort, recurrence: quest.recurrence ?? { cadence: "manual" }, urgency: quest.urgency, escalation: quest.escalation ?? "non-escalating", statEffects: quest.statEffects, active: true, createdAt: quest.createdAt, updatedAt: quest.lastCompletedAt ?? quest.createdAt, rewardMode: "manual", manualXpReward: quest.xpReward, recommendation: quest.recommendation });
  }
  return [...templates.values()];
}

function migrateV2(value: Record<string, unknown>, now: Date): Record<string, unknown> | null {
  if (value.schemaVersion !== 2 || !Array.isArray(value.quests)) return null;
  const quests = value.quests as Quest[]; const date = toLocalDateKey(now);
  return { ...value, schemaVersion: 3, quests, questTemplates: templatesFromQuests(quests), dailyContext: { date, energy: "good", availableMinutes: 15 } };
}

function skillsFromProgression(progression: Progression): SkillProgression {
  const categories: QuestCategory[] = ["cleaning", "cooking", "organization", "homekeeping"];
  return Object.fromEntries(categories.map((category) => { const legacy = progression.categoryStats[category] ?? { xp: 0, completed: 0 }; return [category, { totalXp: legacy.xp, completedQuestCount: legacy.completed, unlockedPerkIds: perksForLevel(category, getSkillLevelProgress(legacy.xp).level) }]; })) as SkillProgression;
}

function migrateV3(value: Record<string, unknown>, now: Date): LegacyV4State | null {
  if (value.schemaVersion !== 3 || !value.progression || !Array.isArray(value.quests)) return null;
  const progression = value.progression as Progression;
  const legacyAchievements = Array.isArray(value.achievements) ? value.achievements as Array<Record<string, unknown>> : [];
  const achievements = legacyAchievements.filter((item) => item.unlocked === true || typeof item.unlockedAt === "string").map((item) => ({ id: String(item.id), unlockedAt: typeof item.unlockedAt === "string" ? item.unlockedAt : now.toISOString() }));
  const cosmetics = createDefaultCollection(); const starterIds = new Set(["dishwasher", "dinner", "counters", "trash", "laundry"]);
  const questTemplates = Array.isArray(value.questTemplates) ? (value.questTemplates as QuestTemplate[]).map((template) => ({ ...template, source: template.source ?? (starterIds.has(template.id) ? "starter" as const : "user" as const) })) : [];
  if (achievements.some((item) => item.id === "first-step")) { cosmetics.ownedIds.push("title-little-things"); cosmetics.equippedTitleId = "title-little-things"; }
  return { ...(value as unknown as Omit<LegacyV4State, "schemaVersion" | "homeProgression" | "skills" | "achievements" | "cosmetics" | "dailyChest">), schemaVersion: 4, questTemplates, homeProgression: { totalXp: progression.totalXp }, skills: skillsFromProgression(progression), achievements, cosmetics, dailyChest: { date: toLocalDateKey(now), qualifyingQuestIds: [], status: "locked" } };
}

function freshRachel(today: ReturnType<typeof toLocalDateKey>, now: Date): PlayerState {
  const zeroProgression: Progression = { totalXp: 0, completedQuestCount: 0, categoryStats: { cleaning: { xp: 0, completed: 0 }, cooking: { xp: 0, completed: 0 }, organization: { xp: 0, completed: 0 }, homekeeping: { xp: 0, completed: 0 } } };
  return { id: RACHEL_PLAYER_ID, name: "Rachel", createdAt: now.toISOString(), coins: 0, progression: zeroProgression, skills: skillsFromProgression(zeroProgression), achievements: [], cosmetics: { ownedIds: [] }, avatar: defaultAvatarFor(RACHEL_PLAYER_ID), dailyContext: { date: today, energy: "good", availableMinutes: 15 }, dailyChest: { date: today, qualifyingQuestIds: [], status: "locked" } };
}

export function migrateV4ToV5(legacy: LegacyV4State, now: Date): AppState {
  const today = toLocalDateKey(now); const titleIds = new Set(COSMETICS.filter((item) => item.type === "title").map((item) => item.id));
  const quests = legacy.quests.map((quest) => quest.status === "completed" ? { ...quest, completedByPlayerId: quest.completedByPlayerId ?? TYLER_PLAYER_ID } : quest);
  const lifecycle = { ...legacy.lifecycle, questHistory: legacy.lifecycle.questHistory.map((entry) => entry.event === "completed" ? { ...entry, playerId: entry.playerId ?? TYLER_PLAYER_ID } : entry) };
  const householdOwned = legacy.cosmetics.ownedIds.filter((id) => !titleIds.has(id)); const playerOwned = legacy.cosmetics.ownedIds.filter((id) => titleIds.has(id));
  const householdCosmetics = { ...createDefaultHouseholdCollection(), ownedIds: [...new Set(["night-hearth", ...householdOwned])], equippedThemeId: legacy.cosmetics.equippedThemeId ?? "night-hearth", equippedDecorationIds: legacy.cosmetics.equippedDecorationIds ?? {}, equippedAccentId: legacy.cosmetics.equippedAccentId };
  const tyler: PlayerState = { id: TYLER_PLAYER_ID, name: legacy.player.name || "Tyler", createdAt: now.toISOString(), coins: legacy.player.coins, progression: legacy.progression, skills: legacy.skills, achievements: legacy.achievements, cosmetics: { ownedIds: playerOwned, equippedTitleId: legacy.cosmetics.equippedTitleId }, avatar: defaultAvatarFor(TYLER_PLAYER_ID), dailyContext: { ...legacy.dailyContext, date: legacy.dailyContext?.date ?? today }, dailyChest: legacy.dailyChest };
  return { schemaVersion: 5, household: { id: HOUSEHOLD_ID, name: "Tyler & Rachel's Home", playerIds: [TYLER_PLAYER_ID, RACHEL_PLAYER_ID], quests, questTemplates: legacy.questTemplates, homeStats: legacy.homeStats, inventory: legacy.inventory, homeProgression: legacy.homeProgression, cosmetics: householdCosmetics, lifecycle }, players: { [TYLER_PLAYER_ID]: tyler, [RACHEL_PLAYER_ID]: freshRachel(today, now) }, session: { activePlayerId: TYLER_PLAYER_ID, preferences: { reducedMotion: legacy.preferences?.reducedMotion ?? false } } };
}

function normalizeV5(value: AppState, now: Date): AppState {
  const today = toLocalDateKey(now); const players = Object.fromEntries(Object.entries(value.players).map(([id, player]) => [id, { ...player, avatar: normalizeAvatar(player.avatar, id) }])) as AppState["players"];
  if (!players[RACHEL_PLAYER_ID]) players[RACHEL_PLAYER_ID] = freshRachel(today, now);
  const playerIds = [...new Set([...value.household.playerIds, ...Object.keys(players)])];
  const activePlayerId = players[value.session.activePlayerId] ? value.session.activePlayerId : playerIds[0];
  return { ...value, household: { ...value.household, playerIds }, players, session: { ...value.session, activePlayerId, preferences: { reducedMotion: value.session.preferences?.reducedMotion ?? false } } };
}

export class LocalStoragePersistence implements HomeQuestPersistence {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {}
  async load(): Promise<AppState | null> {
    const raw = this.storage.getItem(STORAGE_KEY); if (!raw) return null;
    try {
      const value = JSON.parse(raw) as Record<string, unknown>; const now = new Date();
      if (value.schemaVersion === 5) return normalizeV5(value as unknown as AppState, now);
      if (value.schemaVersion === 4) return migrateV4ToV5(value as unknown as LegacyV4State, now);
      const v4 = value.schemaVersion === 3 ? migrateV3(value, now) : (() => { const v1Quests = normalizedV1Quests(value); const v3 = v1Quests ? migrateV2({ ...value, schemaVersion: 2, quests: v1Quests, lifecycle: { dailyHistory: [], questHistory: [] } }, now) : migrateV2(value, now); return v3 ? migrateV3(v3, now) : null; })();
      return v4 ? migrateV4ToV5(v4, now) : null;
    } catch { return null; }
  }
  async save(state: AppState): Promise<void> { this.storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  async clear(): Promise<void> { this.storage.removeItem(STORAGE_KEY); }
}
