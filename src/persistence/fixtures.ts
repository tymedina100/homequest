import { createSeedState } from "@/data/seed";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "@/domain/players";

/** Small realistic persisted fixtures for migration and restore regression tests. */
export function createDailyUseFixture(now = new Date()) {
  const state = structuredClone(createSeedState(now));
  state.household.zones.kitchen.condition = { dishes: 43, counters: 71, floor: 68, trash: 55, food: 62 };
  state.household.zones.bathroom.condition = { sink: 72, toilet: 31, shower: 65, floor: 58, supplies: 82 };
  state.household.cosmetics.ownedIds.push("coffee-station", "bathroom-art");
  state.household.zones.kitchen.cosmetics.equippedDecorationIds.counter = "coffee-station";
  state.household.zones.bathroom.cosmetics.equippedDecorationIds.wall = "bathroom-art";
  state.players[RACHEL_PLAYER_ID].coins = 38;
  state.players[RACHEL_PLAYER_ID].progression.totalXp = 95;
  state.players[RACHEL_PLAYER_ID].progression.completedQuestCount = 3;
  return state;
}

export function schemaV6Fixture() {
  const current = structuredClone(createSeedState(new Date(2026, 7, 23, 10)));
  const { bathroom: _bathroom, ...zones } = current.household.zones;
  void _bathroom;
  return { ...current, schemaVersion: 6 as const, household: { ...current.household, zones } };
}

export function schemaV5Fixture() {
  const current = schemaV6Fixture();
  const { zones: _zones, ...household } = current.household;
  void _zones;
  return { ...current, schemaVersion: 5 as const, household };
}

export function schemaV4Fixture() {
  const state = schemaV6Fixture(); const tyler = state.players[TYLER_PLAYER_ID];
  return { schemaVersion: 4 as const, player: { name: tyler.name, coins: tyler.coins }, quests: state.household.quests, questTemplates: state.household.questTemplates, homeStats: state.household.homeStats, inventory: state.household.inventory, progression: tyler.progression, homeProgression: state.household.homeProgression, skills: tyler.skills, achievements: tyler.achievements, cosmetics: { ...state.household.cosmetics, ownedIds: [...state.household.cosmetics.ownedIds, ...tyler.cosmetics.ownedIds], equippedTitleId: tyler.cosmetics.equippedTitleId }, dailyChest: tyler.dailyChest, preferences: state.session.preferences, dailyContext: tyler.dailyContext, lifecycle: state.household.lifecycle };
}
