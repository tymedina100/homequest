import { normalizeAvatar, defaultAvatarFor } from "@/domain/avatar";
import { COSMETICS, createDefaultCollection, createDefaultHouseholdCollection } from "@/domain/cosmetics";
import { toLocalDateKey } from "@/domain/dates";
import { HOUSEHOLD_ID, RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "@/domain/players";
import { getSkillLevelProgress, perksForLevel } from "@/domain/skills";
import { withZoneMetadata } from "@/domain/zone-mapping";
import { createKitchenZone, normalizeKitchenCondition } from "@/domain/zones";
import type { AchievementState, AppState, CosmeticCollection, DailyChestState, DailyContext, DailyLifecycleState, HomeProgression, HomeStats, HouseholdState, InventoryItem, PlayerState, Progression, Quest, QuestCategory, QuestTemplate, SkillProgression, UserPreferences } from "@/domain/types";

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

interface LegacyV5State {
  schemaVersion: 5;
  household: Omit<HouseholdState, "zones">;
  players: AppState["players"];
  session: AppState["session"];
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
    templates.set(id, withZoneMetadata({ id, title: quest.title, description: quest.description, category: quest.category, estimatedMinutes: quest.estimatedMinutes, effort: quest.effort, recurrence: quest.recurrence ?? { cadence: "manual" }, urgency: quest.urgency, escalation: quest.escalation ?? "non-escalating", statEffects: quest.statEffects, active: true, createdAt: quest.createdAt, updatedAt: quest.lastCompletedAt ?? quest.createdAt, rewardMode: "manual", manualXpReward: quest.xpReward, recommendation: quest.recommendation }));
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

export function migrateV4ToV5(legacy: LegacyV4State, now: Date): LegacyV5State {
  const today = toLocalDateKey(now); const titleIds = new Set(COSMETICS.filter((item) => item.type === "title").map((item) => item.id));
  const quests = legacy.quests.map((quest) => quest.status === "completed" ? { ...quest, completedByPlayerId: quest.completedByPlayerId ?? TYLER_PLAYER_ID } : quest);
  const lifecycle = { ...legacy.lifecycle, questHistory: legacy.lifecycle.questHistory.map((entry) => entry.event === "completed" ? { ...entry, playerId: entry.playerId ?? TYLER_PLAYER_ID } : entry) };
  const householdOwned = legacy.cosmetics.ownedIds.filter((id) => !titleIds.has(id)); const playerOwned = legacy.cosmetics.ownedIds.filter((id) => titleIds.has(id));
  const householdCosmetics = { ...createDefaultHouseholdCollection(), ownedIds: [...new Set(["night-hearth", ...householdOwned])], equippedThemeId: legacy.cosmetics.equippedThemeId ?? "night-hearth", equippedDecorationIds: legacy.cosmetics.equippedDecorationIds ?? {}, equippedAccentId: legacy.cosmetics.equippedAccentId };
  const tyler: PlayerState = { id: TYLER_PLAYER_ID, name: legacy.player.name || "Tyler", createdAt: now.toISOString(), coins: legacy.player.coins, progression: legacy.progression, skills: legacy.skills, achievements: legacy.achievements, cosmetics: { ownedIds: playerOwned, equippedTitleId: legacy.cosmetics.equippedTitleId }, avatar: defaultAvatarFor(TYLER_PLAYER_ID), dailyContext: { ...legacy.dailyContext, date: legacy.dailyContext?.date ?? today }, dailyChest: legacy.dailyChest };
  return { schemaVersion: 5, household: { id: HOUSEHOLD_ID, name: "Tyler & Rachel's Home", playerIds: [TYLER_PLAYER_ID, RACHEL_PLAYER_ID], quests, questTemplates: legacy.questTemplates, homeStats: legacy.homeStats, inventory: legacy.inventory, homeProgression: legacy.homeProgression, cosmetics: householdCosmetics, lifecycle }, players: { [TYLER_PLAYER_ID]: tyler, [RACHEL_PLAYER_ID]: freshRachel(today, now) }, session: { activePlayerId: TYLER_PLAYER_ID, preferences: { reducedMotion: legacy.preferences?.reducedMotion ?? false } } };
}

/** Adds structured room metadata and conservatively credits prior Home work to the first zone. */
export function migrateV5ToV6(value: LegacyV5State): AppState {
  const quests = value.household.quests.map((quest) => {
    const mapped = withZoneMetadata({ ...quest, id: quest.templateId ?? quest.id });
    return { ...mapped, id: quest.id };
  });
  const questTemplates = value.household.questTemplates.map((template) => withZoneMetadata(template));
  const legacyKitchenXp = Math.round(value.household.homeProgression.totalXp * 0.4);
  return {
    ...value,
    schemaVersion: 6,
    household: {
      ...value.household,
      quests,
      questTemplates,
      zones: { kitchen: createKitchenZone(value.household.homeStats, legacyKitchenXp, 5) },
    },
  };
}

function normalizeV6(value: AppState): AppState | null {
  if (!value.household?.zones?.kitchen || !value.players || !value.session) return null;
  const players = Object.fromEntries(Object.entries(value.players).map(([id, player]) => [id, { ...player, avatar: normalizeAvatar(player.avatar, id) }])) as AppState["players"];
  const playerIds = [...new Set(value.household.playerIds.filter((id) => Boolean(players[id])))];
  const activePlayerId = players[value.session.activePlayerId] ? value.session.activePlayerId : playerIds[0];
  const kitchen = value.household.zones.kitchen;
  return { ...value, household: { ...value.household, playerIds, zones: { ...value.household.zones, kitchen: { ...kitchen, totalXp: Math.max(0, Math.floor(kitchen.totalXp)), condition: normalizeKitchenCondition(kitchen.condition ?? {}), cosmetics: { equippedDecorationIds: kitchen.cosmetics?.equippedDecorationIds ?? {} } } } }, players, session: { ...value.session, activePlayerId, preferences: { reducedMotion: value.session.preferences?.reducedMotion ?? false } } };
}

function nonNegative(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }

/** Runtime invariant check used by both startup migration and backup restore. */
export function validateAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const state = value as AppState;
  if (state.schemaVersion !== 6 || !state.household || !state.players || !state.session) return false;
  if (!state.household.id || !state.household.name?.trim() || !Array.isArray(state.household.playerIds) || !state.household.playerIds.length) return false;
  if (new Set(state.household.playerIds).size !== state.household.playerIds.length || !state.players[state.session.activePlayerId]) return false;
  if (!state.household.playerIds.every((id) => state.players[id]?.id === id)) return false;
  if (!Array.isArray(state.household.quests) || !Array.isArray(state.household.questTemplates) || !Array.isArray(state.household.inventory)) return false;
  if (!state.household.lifecycle || !Array.isArray(state.household.lifecycle.questHistory) || !Array.isArray(state.household.lifecycle.dailyHistory)) return false;
  if (!nonNegative(state.household.homeProgression?.totalXp)) return false;
  const kitchen = state.household.zones?.kitchen;
  if (!kitchen || kitchen.id !== "kitchen" || kitchen.type !== "kitchen" || !nonNegative(kitchen.totalXp)) return false;
  if (!kitchen.condition || Object.values(kitchen.condition).some((value) => !nonNegative(value) || value > 100)) return false;
  const playerIds = new Set(state.household.playerIds);
  for (const player of Object.values(state.players)) {
    if (!player.name?.trim() || !nonNegative(player.coins) || !nonNegative(player.progression?.totalXp) || !nonNegative(player.progression?.completedQuestCount)) return false;
  }
  if (state.household.quests.some((quest) => quest.completedByPlayerId && !playerIds.has(quest.completedByPlayerId))) return false;
  if (state.household.lifecycle.questHistory.some((entry) => entry.playerId && !playerIds.has(entry.playerId))) return false;
  const zoneIds = new Set(["household", "kitchen"]);
  if (state.household.quests.some((quest) => !zoneIds.has(quest.zoneId)) || state.household.questTemplates.some((template) => !zoneIds.has(template.zoneId))) return false;
  const templateIds = new Set(state.household.questTemplates.map((template) => template.id));
  return state.household.quests.every((quest) => !quest.templateId || templateIds.has(quest.templateId) || quest.kind === "rescue" || quest.kind === "comeback");
}

/** Canonical persisted-state migration chain, shared by startup and backup restore. */
export function migratePersistedState(value: unknown, now = new Date()): AppState | null {
  try {
    if (!value || typeof value !== "object") return null;
    const raw = value as Record<string, unknown>;
    let migrated: AppState | null;
    if (raw.schemaVersion === 6) migrated = normalizeV6(raw as unknown as AppState);
    else if (raw.schemaVersion === 5) migrated = migrateV5ToV6(raw as unknown as LegacyV5State);
    else if (raw.schemaVersion === 4) migrated = migrateV5ToV6(migrateV4ToV5(raw as unknown as LegacyV4State, now));
    else {
      const v4 = raw.schemaVersion === 3 ? migrateV3(raw, now) : (() => { const v1Quests = normalizedV1Quests(raw); const v3 = v1Quests ? migrateV2({ ...raw, schemaVersion: 2, quests: v1Quests, lifecycle: { dailyHistory: [], questHistory: [] } }, now) : migrateV2(raw, now); return v3 ? migrateV3(v3, now) : null; })();
      migrated = v4 ? migrateV5ToV6(migrateV4ToV5(v4, now)) : null;
    }
    return migrated && validateAppState(migrated) ? migrated : null;
  } catch {
    return null;
  }
}

export class LocalStoragePersistence implements HomeQuestPersistence {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {}
  async load(): Promise<AppState | null> {
    const raw = this.storage.getItem(STORAGE_KEY); if (!raw) return null;
    try {
      return migratePersistedState(JSON.parse(raw), new Date());
    } catch { return null; }
  }
  async save(state: AppState): Promise<void> { this.storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  async clear(): Promise<void> { this.storage.removeItem(STORAGE_KEY); }
}
