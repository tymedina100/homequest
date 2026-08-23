import { createSeedState } from "@/data/seed";
import { TYLER_PLAYER_ID } from "@/domain/players";

/** Small realistic persisted fixtures for migration and restore regression tests. */
export function schemaV5Fixture() { return structuredClone(createSeedState(new Date(2026, 7, 23, 10))); }

export function schemaV4Fixture() {
  const state = schemaV5Fixture(); const tyler = state.players[TYLER_PLAYER_ID];
  return { schemaVersion: 4 as const, player: { name: tyler.name, coins: tyler.coins }, quests: state.household.quests, questTemplates: state.household.questTemplates, homeStats: state.household.homeStats, inventory: state.household.inventory, progression: tyler.progression, homeProgression: state.household.homeProgression, skills: tyler.skills, achievements: tyler.achievements, cosmetics: { ...state.household.cosmetics, ownedIds: [...state.household.cosmetics.ownedIds, ...tyler.cosmetics.ownedIds], equippedTitleId: tyler.cosmetics.equippedTitleId }, dailyChest: tyler.dailyChest, preferences: state.session.preferences, dailyContext: tyler.dailyContext, lifecycle: state.household.lifecycle };
}
