import { evaluateAchievements } from "./achievements";
import { dateKeyFromIso } from "./dates";
import { recordDailyChestQuest } from "./daily-chest";
import { COMEBACK_COIN_BONUS, HOME_LEVEL_COIN_BONUS, HOME_XP_BASE, PLAYER_LEVEL_COIN_BONUS, RESCUE_COIN_BONUS } from "./game-balance";
import { getHomeLevelProgress } from "./home-progression";
import { recordQuestCompletion } from "./lifecycle";
import { updatePlayer } from "./players";
import { awardQuestXp, getLevelProgress } from "./progression";
import { applyHomeStatEffects } from "./home-state";
import { calculateSkillXp, categoryToSkill, getSkillLevelProgress, perksForLevel } from "./skills";
import { applyBathroomEffects, applyKitchenEffects, calculateBathroomQuestXp, calculateKitchenQuestXp, getBathroomLevelProgress, getZoneLevelProgress } from "./zones";
import type { AppState, BathroomCondition, KitchenCondition, PlayerId, Quest, SkillKey } from "./types";

export interface CompletionSummary {
  playerName: string; questTitle: string; playerXp: number; skill: SkillKey; skillXp: number; homeXp: number; coins: number;
  playerLevel?: number; skillLevel?: number; homeLevel?: number; homeTier?: string;
  kitchenXp: number; kitchenEffects?: Partial<KitchenCondition>; kitchenLevel?: number; kitchenTier?: string;
  bathroomXp: number; bathroomEffects?: Partial<BathroomCondition>; bathroomLevel?: number; bathroomTier?: string;
  perkIds: string[]; achievementIds: string[]; cosmeticIds: string[]; chestUnlocked: boolean;
}
export interface CompletionResult { state: AppState; applied: boolean; summary?: CompletionSummary }

export function calculateHomeXp(quest: Quest): number {
  const effort = quest.effort === "high" ? 8 : quest.effort === "medium" ? 4 : 0;
  const time = Math.min(12, Math.floor(quest.estimatedMinutes / 5) * 2);
  const kind = quest.kind === "rescue" ? 6 : quest.kind === "comeback" ? 4 : 0;
  return HOME_XP_BASE + effort + time + kind;
}

/** Applies shared-home and acting-player rewards as one immutable transaction. */
export function completeQuestTransaction(state: AppState, questId: string, playerId: PlayerId, completedAt: string): CompletionResult {
  const quest = state.household.quests.find((item) => item.id === questId); const player = state.players[playerId];
  if (!player || !state.household.playerIds.includes(playerId) || !quest || quest.status === "completed" || quest.status === "archived") return { state, applied: false };
  const skill = categoryToSkill(quest.category); const oldPlayerLevel = getLevelProgress(player.progression.totalXp).level; const oldSkillLevel = getSkillLevelProgress(player.skills[skill]).level; const oldHome = getHomeLevelProgress(state.household.homeProgression); const oldKitchen = getZoneLevelProgress(state.household.zones.kitchen.totalXp); const oldBathroom = getBathroomLevelProgress(state.household.zones.bathroom.totalXp);
  const skillXp = calculateSkillXp(state, playerId, quest, completedAt); const homeXp = calculateHomeXp(quest); const kitchenXp = calculateKitchenQuestXp(quest); const bathroomXp = calculateBathroomQuestXp(quest);
  const baseCoins = Math.max(1, Math.round(quest.xpReward / 10)) + (quest.kind === "rescue" ? RESCUE_COIN_BONUS : quest.kind === "comeback" ? COMEBACK_COIN_BONUS : 0) + (quest.kind === "rescue" && skill === "cleaning" && oldSkillLevel >= 6 ? 3 : 0) + (quest.kind === "comeback" && oldSkillLevel >= 4 ? 3 : 0);
  const newSkillXp = player.skills[skill].totalXp + skillXp; const newSkillLevel = getSkillLevelProgress(newSkillXp).level; const perkIds = perksForLevel(skill, newSkillLevel); const newlyUnlockedPerks = perkIds.filter((id) => !player.skills[skill].unlockedPerkIds.includes(id));
  let next = updatePlayer(state, playerId, (current) => ({
    ...current,
    coins: current.coins + baseCoins,
    progression: awardQuestXp(current.progression, quest),
    skills: { ...current.skills, [skill]: { totalXp: newSkillXp, completedQuestCount: current.skills[skill].completedQuestCount + 1, unlockedPerkIds: perkIds } },
  }));
  next = { ...next, household: {
    ...next.household,
    quests: next.household.quests.map((item) => item.id === questId ? { ...item, status: "completed" as const, lastCompletedAt: completedAt, completedByPlayerId: playerId, missedCount: 0 } : quest.kind === "rescue" && item.templateId === quest.rescueOf ? { ...item, missedCount: 0, lastCompletedAt: completedAt } : item),
    homeStats: applyHomeStatEffects(next.household.homeStats, quest.statEffects),
    homeProgression: { totalXp: next.household.homeProgression.totalXp + homeXp },
    zones: {
      ...next.household.zones,
      kitchen: kitchenXp ? { ...next.household.zones.kitchen, totalXp: next.household.zones.kitchen.totalXp + kitchenXp, condition: applyKitchenEffects(next.household.zones.kitchen.condition, quest.zoneEffects) } : next.household.zones.kitchen,
      bathroom: bathroomXp ? { ...next.household.zones.bathroom, totalXp: next.household.zones.bathroom.totalXp + bathroomXp, condition: applyBathroomEffects(next.household.zones.bathroom.condition, quest.zoneEffects) } : next.household.zones.bathroom,
    },
  } };
  next = recordQuestCompletion(next, quest, playerId, completedAt);
  const chest = recordDailyChestQuest(next, playerId, quest, dateKeyFromIso(completedAt)); next = chest.state;
  const achievements = evaluateAchievements(next, playerId, completedAt); next = achievements.state;
  const finalPlayer = next.players[playerId]; const playerLevel = getLevelProgress(finalPlayer.progression.totalXp).level; const home = getHomeLevelProgress(next.household.homeProgression);
  const kitchen = getZoneLevelProgress(next.household.zones.kitchen.totalXp); const bathroom = getBathroomLevelProgress(next.household.zones.bathroom.totalXp);
  const levelCoins = Math.max(0, playerLevel - oldPlayerLevel) * PLAYER_LEVEL_COIN_BONUS + Math.max(0, home.level - oldHome.level) * HOME_LEVEL_COIN_BONUS;
  if (levelCoins) next = updatePlayer(next, playerId, (current) => ({ ...current, coins: current.coins + levelCoins }));
  return { state: next, applied: true, summary: { playerName: player.name, questTitle: quest.title, playerXp: quest.xpReward, skill, skillXp, homeXp: homeXp + achievements.homeXp, kitchenXp, kitchenEffects: kitchenXp ? quest.zoneEffects : undefined, bathroomXp, bathroomEffects: bathroomXp ? quest.zoneEffects : undefined, coins: baseCoins + achievements.coins + levelCoins, playerLevel: playerLevel > oldPlayerLevel ? playerLevel : undefined, skillLevel: newSkillLevel > oldSkillLevel ? newSkillLevel : undefined, homeLevel: home.level > oldHome.level ? home.level : undefined, homeTier: home.tier > oldHome.tier ? home.tierName : undefined, kitchenLevel: kitchen.level > oldKitchen.level ? kitchen.level : undefined, kitchenTier: kitchen.tier > oldKitchen.tier ? kitchen.tierName : undefined, bathroomLevel: bathroom.level > oldBathroom.level ? bathroom.level : undefined, bathroomTier: bathroom.tier > oldBathroom.tier ? bathroom.tierName : undefined, perkIds: newlyUnlockedPerks, achievementIds: achievements.unlockedIds, cosmeticIds: achievements.cosmeticIds, chestUnlocked: chest.unlocked } };
}
