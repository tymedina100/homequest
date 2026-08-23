import { beforeEach, describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "@/domain/players";
import { schemaV5Fixture, schemaV6Fixture } from "./fixtures";
import { LocalStoragePersistence, migratePersistedState, STORAGE_KEY } from "./store";

function legacyV4() {
  const state = createSeedState(new Date(2026, 7, 23, 10)); const tyler = state.players[TYLER_PLAYER_ID];
  return {
    schemaVersion: 4, player: { name: tyler.name, coins: tyler.coins }, quests: state.household.quests,
    questTemplates: state.household.questTemplates, homeStats: state.household.homeStats, inventory: state.household.inventory,
    progression: tyler.progression, homeProgression: state.household.homeProgression, skills: tyler.skills,
    achievements: tyler.achievements, cosmetics: { ...state.household.cosmetics, ownedIds: [...state.household.cosmetics.ownedIds, ...tyler.cosmetics.ownedIds], equippedTitleId: tyler.cosmetics.equippedTitleId },
    dailyChest: tyler.dailyChest, preferences: { reducedMotion: false }, dailyContext: tyler.dailyContext, lifecycle: state.household.lifecycle,
  };
}

describe("local persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips the full application state", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const state = createSeedState();
    state.players[RACHEL_PLAYER_ID].progression.totalXp = 999; state.session.activePlayerId = RACHEL_PLAYER_ID;
    await persistence.save(state); const restored = await persistence.load();
    expect(restored?.players[RACHEL_PLAYER_ID].progression.totalXp).toBe(999);
    expect(restored?.session.activePlayerId).toBe(RACHEL_PLAYER_ID);
  });

  it("fails safely for corrupt or unknown saves", async () => {
    const persistence = new LocalStoragePersistence(localStorage); localStorage.setItem(STORAGE_KEY, "not-json"); expect(await persistence.load()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99 })); expect(await persistence.load()).toBeNull();
  });

  it("clears only the HomeQuest save key", async () => {
    const persistence = new LocalStoragePersistence(localStorage); localStorage.setItem("unrelated", "keep"); await persistence.save(createSeedState()); await persistence.clear();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull(); expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("migrates a Milestone 0.1 save without losing progression", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const legacy = legacyV4();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...legacy, schemaVersion: 1, lifecycle: undefined })); const migrated = await persistence.load();
    expect(migrated).toMatchObject({ schemaVersion: 7, players: { [TYLER_PLAYER_ID]: { progression: { totalXp: legacy.progression.totalXp } } }, household: { homeProgression: { totalXp: legacy.progression.totalXp }, zones: { kitchen: { id: "kitchen" }, bathroom: { id: "bathroom" } } } });
    expect(migrated?.household.lifecycle.dailyHistory).toEqual([]);
    expect(migrated?.household.quests[0]).toMatchObject({ templateId: "dishwasher", missedCount: 0 });
    expect(migrated?.household.questTemplates[0]).toMatchObject({ id: "dishwasher", active: true });
  });

  it("migrates a Milestone 0.2 save into templates and a player daily context", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const legacy = legacyV4();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...legacy, schemaVersion: 2, questTemplates: undefined, dailyContext: undefined })); const migrated = await persistence.load();
    expect(migrated?.schemaVersion).toBe(7);
    expect(migrated?.household.questTemplates.map((template) => template.id)).toContain("dishwasher");
    expect(migrated?.players[TYLER_PLAYER_ID].dailyContext.availableMinutes).toBe(15);
  });

  it("persists shared collection data and per-player context across reloads", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const state = createSeedState();
    state.players[RACHEL_PLAYER_ID].dailyContext = { ...state.players[RACHEL_PLAYER_ID].dailyContext, energy: "low", availableMinutes: 5 };
    state.household.questTemplates[0] = { ...state.household.questTemplates[0], active: false };
    state.household.cosmetics = { ...state.household.cosmetics, ownedIds: [...state.household.cosmetics.ownedIds, "morning-grove", "monstera-plant"], equippedThemeId: "morning-grove", equippedDecorationIds: { plant: "monstera-plant" } };
    await persistence.save(state); const restored = await persistence.load();
    expect(restored?.players[RACHEL_PLAYER_ID].dailyContext).toMatchObject({ energy: "low", availableMinutes: 5 });
    expect(restored?.household.questTemplates[0].active).toBe(false);
    expect(restored?.household.cosmetics).toMatchObject({ equippedThemeId: "morning-grove", equippedDecorationIds: { plant: "monstera-plant" } });
  });

  it("migrates a Milestone 0.4 schema without losing lifecycle or economy data", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const legacy = legacyV4() as Record<string, unknown>;
    delete legacy.homeProgression; delete legacy.skills; delete legacy.cosmetics; delete legacy.dailyChest; legacy.schemaVersion = 3;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy)); const migrated = await persistence.load();
    expect(migrated?.schemaVersion).toBe(7);
    expect(migrated?.players[TYLER_PLAYER_ID].skills.cleaning.totalXp).toBe(migrated?.players[TYLER_PLAYER_ID].progression.categoryStats.cleaning.xp);
    expect(migrated?.household.cosmetics.equippedThemeId).toBe("night-hearth");
  });

  it("migrates v4 personal progress to Tyler, creates fresh Rachel, and attributes old completions", async () => {
    const persistence = new LocalStoragePersistence(localStorage); const legacy = legacyV4();
    legacy.quests[0] = { ...legacy.quests[0], status: "completed", lastCompletedAt: "2026-08-22T10:00:00.000Z" };
    legacy.lifecycle.questHistory = [{ questId: legacy.quests[0].id, templateId: legacy.quests[0].templateId, date: "2026-08-22", event: "completed" }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy)); const migrated = await persistence.load();
    expect(migrated?.players[TYLER_PLAYER_ID].progression.totalXp).toBe(legacy.progression.totalXp);
    expect(migrated?.players[RACHEL_PLAYER_ID]).toMatchObject({ name: "Rachel", coins: 0, progression: { totalXp: 0 }, achievements: [] });
    expect(migrated?.household.quests[0].completedByPlayerId).toBe(TYLER_PLAYER_ID);
    expect(migrated?.household.lifecycle.questHistory[0].playerId).toBe(TYLER_PLAYER_ID);
  });

  it("migrates schema v5 through Kitchen into stable Kitchen and Bathroom zones", () => {
    const legacy = schemaV5Fixture();
    const migrated = migratePersistedState(legacy, new Date(2026, 7, 23, 10));
    expect(migrated).toMatchObject({ schemaVersion: 7, household: { zones: { kitchen: { totalXp: 110, metadata: { initializedFromSchema: 5 }, condition: { dishes: 57, counters: 56, floor: 58, trash: 56, food: 70 } }, bathroom: { totalXp: 0, metadata: { initializedFromSchema: 6 }, condition: { sink: 58, toilet: 59, shower: 58, floor: 58, supplies: 68 } } } } });
    expect(migrated?.household.quests.find((quest) => quest.id === "dishwasher")).toMatchObject({ zoneId: "kitchen", zoneEffects: { dishes: 20 } });
    expect(migrated?.household.quests.find((quest) => quest.id === "laundry")?.zoneId).toBe("household");
    expect(migratePersistedState(migrated, new Date(2026, 7, 23, 10))).toEqual(migrated);
  });

  it("migrates an existing v6 Kitchen without changing its progression or decor", () => {
    const legacy = schemaV6Fixture(); legacy.household.zones.kitchen.totalXp = 222; legacy.household.zones.kitchen.cosmetics.equippedDecorationIds = { plant: "kitchen-herb-garden" };
    const migrated = migratePersistedState(legacy, new Date(2026, 7, 23, 10));
    expect(migrated?.household.zones).toMatchObject({ kitchen: { totalXp: 222, cosmetics: { equippedDecorationIds: { plant: "kitchen-herb-garden" } } }, bathroom: { id: "bathroom", totalXp: 0 } });
  });
});
