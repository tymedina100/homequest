import { beforeEach, describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { LocalStoragePersistence, STORAGE_KEY } from "./store";

describe("local persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips the full application state", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    const state = createSeedState();
    state.progression.totalXp = 999;
    await persistence.save(state);
    expect((await persistence.load())?.progression.totalXp).toBe(999);
  });

  it("fails safely for corrupt or unknown saves", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(await persistence.load()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(await persistence.load()).toBeNull();
  });

  it("clears only the HomeQuest save key", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    localStorage.setItem("unrelated", "keep");
    await persistence.save(createSeedState());
    await persistence.clear();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("migrates a Milestone 0.1 save without losing progression", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    const legacy = createSeedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...legacy, schemaVersion: 1, lifecycle: undefined }));
    const migrated = await persistence.load();
    expect(migrated).toMatchObject({ schemaVersion: 4, progression: { totalXp: legacy.progression.totalXp }, homeProgression: { totalXp: legacy.progression.totalXp } });
    expect(migrated?.lifecycle.dailyHistory).toEqual([]);
    expect(migrated?.quests[0]).toMatchObject({ templateId: "dishwasher", missedCount: 0 });
    expect(migrated?.questTemplates[0]).toMatchObject({ id: "dishwasher", active: true });
  });

  it("migrates a Milestone 0.2 save into templates and a daily context", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    const v2 = createSeedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...v2, schemaVersion: 2, questTemplates: undefined, dailyContext: undefined }));
    const migrated = await persistence.load();
    expect(migrated?.schemaVersion).toBe(4);
    expect(migrated?.questTemplates.map((template) => template.id)).toContain("dishwasher");
    expect(migrated?.dailyContext.availableMinutes).toBe(15);
    expect(migrated?.lifecycle.questHistory).toEqual(v2.lifecycle.questHistory);
  });

  it("persists templates and daily context across reloads", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    const state = createSeedState();
    state.dailyContext = { ...state.dailyContext, energy: "low", availableMinutes: 5 };
    state.questTemplates[0] = { ...state.questTemplates[0], active: false };
    state.cosmetics = { ...state.cosmetics, ownedIds: [...state.cosmetics.ownedIds, "morning-grove", "monstera-plant"], equippedThemeId: "morning-grove", equippedDecorationIds: { plant: "monstera-plant" } };
    await persistence.save(state);
    const restored = await persistence.load();
    expect(restored?.dailyContext).toMatchObject({ energy: "low", availableMinutes: 5 });
    expect(restored?.questTemplates[0].active).toBe(false);
    expect(restored?.cosmetics).toMatchObject({ equippedThemeId: "morning-grove", equippedDecorationIds: { plant: "monstera-plant" } });
  });

  it("migrates a Milestone 0.4 schema without losing lifecycle or economy data", async () => {
    const persistence = new LocalStoragePersistence(localStorage);
    const current = createSeedState();
    const legacy = JSON.parse(JSON.stringify(current)) as Record<string, unknown>;
    delete legacy.homeProgression; delete legacy.skills; delete legacy.cosmetics; delete legacy.dailyChest;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...legacy, schemaVersion: 3 }));
    const migrated = await persistence.load();
    expect(migrated).toMatchObject({ schemaVersion: 4, player: current.player, lifecycle: current.lifecycle, homeStats: current.homeStats });
    expect(migrated?.skills.cleaning.totalXp).toBe(current.progression.categoryStats.cleaning.xp);
    expect(migrated?.cosmetics.equippedThemeId).toBe("night-hearth");
  });
});
