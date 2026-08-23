import { DAILY_CHEST_COINS, DAILY_CHEST_HOME_XP, DAILY_CHEST_PLAYER_XP, DAILY_CHEST_QUESTS, MEANINGFUL_MIN_MINUTES, MEANINGFUL_MIN_XP } from "./game-balance";
import { getHomeLevelProgress } from "./home-progression";
import { getLevelProgress } from "./progression";
import { toLocalDateKey } from "./dates";
import type { AppState, LocalDateKey, Quest } from "./types";

export function initializeDailyChest(state: AppState, date: LocalDateKey): AppState {
  if (state.dailyChest.date === date) return state;
  return { ...state, dailyChest: { date, qualifyingQuestIds: [], status: "locked" } };
}

export function isMeaningfulForChest(quest: Quest): boolean { return quest.estimatedMinutes >= MEANINGFUL_MIN_MINUTES && quest.xpReward >= MEANINGFUL_MIN_XP; }

export function recordDailyChestQuest(state: AppState, quest: Quest, date: LocalDateKey): { state: AppState; unlocked: boolean } {
  let next = initializeDailyChest(state, date);
  if (next.dailyChest.status === "claimed" || !isMeaningfulForChest(quest)) return { state: next, unlocked: false };
  const template = quest.templateId ?? quest.id;
  const duplicateTemplate = next.dailyChest.qualifyingQuestIds.some((id) => { const prior = next.quests.find((item) => item.id === id); return (prior?.templateId ?? prior?.id) === template; });
  if (duplicateTemplate || next.dailyChest.qualifyingQuestIds.includes(quest.id)) return { state: next, unlocked: false };
  const qualifyingQuestIds = [...next.dailyChest.qualifyingQuestIds, quest.id];
  const unlocked = qualifyingQuestIds.length >= DAILY_CHEST_QUESTS && next.dailyChest.status !== "ready";
  next = { ...next, dailyChest: { ...next.dailyChest, qualifyingQuestIds, status: qualifyingQuestIds.length >= DAILY_CHEST_QUESTS ? "ready" : "locked" } };
  return { state: next, unlocked };
}

export interface ChestClaimResult { state: AppState; claimed: boolean; playerLevel?: number; homeLevel?: number }
export function claimDailyChest(state: AppState, claimedAt: string): ChestClaimResult {
  const date = toLocalDateKey(new Date(claimedAt)); const current = initializeDailyChest(state, date);
  if (current.dailyChest.status !== "ready") return { state: current, claimed: false };
  const oldPlayer = getLevelProgress(current.progression.totalXp).level; const oldHome = getHomeLevelProgress(current.homeProgression).level;
  const next = { ...current, player: { ...current.player, coins: current.player.coins + DAILY_CHEST_COINS }, progression: { ...current.progression, totalXp: current.progression.totalXp + DAILY_CHEST_PLAYER_XP }, homeProgression: { totalXp: current.homeProgression.totalXp + DAILY_CHEST_HOME_XP }, dailyChest: { ...current.dailyChest, status: "claimed" as const, claimedAt } };
  const playerLevel = getLevelProgress(next.progression.totalXp).level; const homeLevel = getHomeLevelProgress(next.homeProgression).level;
  return { state: next, claimed: true, playerLevel: playerLevel > oldPlayer ? playerLevel : undefined, homeLevel: homeLevel > oldHome ? homeLevel : undefined };
}
