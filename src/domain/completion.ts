import { evaluateAchievements } from "./achievements";
import { dateKeyFromIso } from "./dates";
import { recordDailyChestQuest } from "./daily-chest";
import { COMEBACK_COIN_BONUS, HOME_LEVEL_COIN_BONUS, HOME_XP_BASE, PLAYER_LEVEL_COIN_BONUS, RESCUE_COIN_BONUS } from "./game-balance";
import { getHomeLevelProgress } from "./home-progression";
import { recordQuestCompletion } from "./lifecycle";
import { awardQuestXp, getLevelProgress } from "./progression";
import { applyHomeStatEffects } from "./home-state";
import { calculateSkillXp, categoryToSkill, getSkillLevelProgress, perksForLevel } from "./skills";
import type { AppState, Quest, SkillKey } from "./types";

export interface CompletionSummary {
  questTitle: string; playerXp: number; skill: SkillKey; skillXp: number; homeXp: number; coins: number;
  playerLevel?: number; skillLevel?: number; homeLevel?: number; homeTier?: string;
  perkIds: string[]; achievementIds: string[]; cosmeticIds: string[]; chestUnlocked: boolean;
}
export interface CompletionResult { state: AppState; applied: boolean; summary?: CompletionSummary }

export function calculateHomeXp(quest: Quest): number {
  const effort = quest.effort === "high" ? 8 : quest.effort === "medium" ? 4 : 0;
  const time = Math.min(12, Math.floor(quest.estimatedMinutes / 5) * 2);
  const kind = quest.kind === "rescue" ? 6 : quest.kind === "comeback" ? 4 : 0;
  return HOME_XP_BASE + effort + time + kind;
}

export function completeQuestTransaction(state: AppState, questId: string, completedAt: string): CompletionResult {
  const quest = state.quests.find((item) => item.id === questId);
  if (!quest || quest.status === "completed" || quest.status === "archived") return { state, applied: false };
  const skill = categoryToSkill(quest.category); const oldPlayerLevel = getLevelProgress(state.progression.totalXp).level; const oldSkillLevel = getSkillLevelProgress(state.skills[skill]).level; const oldHome = getHomeLevelProgress(state.homeProgression);
  const skillXp = calculateSkillXp(state, quest, completedAt); const homeXp = calculateHomeXp(quest);
  const baseCoins = Math.max(1, Math.round(quest.xpReward / 10)) + (quest.kind === "rescue" ? RESCUE_COIN_BONUS : quest.kind === "comeback" ? COMEBACK_COIN_BONUS : 0) + (quest.kind === "rescue" && skill === "cleaning" && oldSkillLevel >= 6 ? 3 : 0) + (quest.kind === "comeback" && oldSkillLevel >= 4 ? 3 : 0);
  const newSkillXp = state.skills[skill].totalXp + skillXp; const newSkillLevel = getSkillLevelProgress(newSkillXp).level; const perkIds = perksForLevel(skill, newSkillLevel); const newlyUnlockedPerks = perkIds.filter((id) => !state.skills[skill].unlockedPerkIds.includes(id));
  let next: AppState = { ...state, player: { ...state.player, coins: state.player.coins + baseCoins }, quests: state.quests.map((item) => item.id === questId ? { ...item, status: "completed" as const, lastCompletedAt: completedAt, missedCount: 0 } : quest.kind === "rescue" && item.templateId === quest.rescueOf ? { ...item, missedCount: 0, lastCompletedAt: completedAt } : item), homeStats: applyHomeStatEffects(state.homeStats, quest.statEffects), progression: awardQuestXp(state.progression, quest), homeProgression: { totalXp: state.homeProgression.totalXp + homeXp }, skills: { ...state.skills, [skill]: { totalXp: newSkillXp, completedQuestCount: state.skills[skill].completedQuestCount + 1, unlockedPerkIds: perkIds } } };
  next = recordQuestCompletion(next, quest, completedAt);
  const chest = recordDailyChestQuest(next, quest, dateKeyFromIso(completedAt)); next = chest.state;
  const achievements = evaluateAchievements(next, completedAt); next = achievements.state;
  const playerLevel = getLevelProgress(next.progression.totalXp).level; const home = getHomeLevelProgress(next.homeProgression);
  const levelCoins = Math.max(0, playerLevel - oldPlayerLevel) * PLAYER_LEVEL_COIN_BONUS + Math.max(0, home.level - oldHome.level) * HOME_LEVEL_COIN_BONUS;
  if (levelCoins) next = { ...next, player: { ...next.player, coins: next.player.coins + levelCoins } };
  return { state: next, applied: true, summary: { questTitle: quest.title, playerXp: quest.xpReward, skill, skillXp, homeXp: homeXp + achievements.homeXp, coins: baseCoins + achievements.coins + levelCoins, playerLevel: playerLevel > oldPlayerLevel ? playerLevel : undefined, skillLevel: newSkillLevel > oldSkillLevel ? newSkillLevel : undefined, homeLevel: home.level > oldHome.level ? home.level : undefined, homeTier: home.tier > oldHome.tier ? home.tierName : undefined, perkIds: newlyUnlockedPerks, achievementIds: achievements.unlockedIds, cosmeticIds: achievements.cosmeticIds, chestUnlocked: chest.unlocked } };
}
