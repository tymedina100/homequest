import { DAILY_CHEST_COINS, DAILY_CHEST_HOME_XP, DAILY_CHEST_PLAYER_XP, DAILY_CHEST_QUESTS, MEANINGFUL_MIN_MINUTES, MEANINGFUL_MIN_XP } from "./game-balance";
import { getHomeLevelProgress } from "./home-progression";
import { getLevelProgress } from "./progression";
import { toLocalDateKey } from "./dates";
import { updatePlayer } from "./players";
import type { AppState, LocalDateKey, PlayerId, Quest } from "./types";

export function initializeDailyChest(state: AppState, playerId: PlayerId, date: LocalDateKey): AppState {
  const player = state.players[playerId];
  if (!player || player.dailyChest.date === date) return state;
  return updatePlayer(state, playerId, (current) => ({ ...current, dailyChest: { date, qualifyingQuestIds: [], status: "locked" } }));
}

export function initializeAllDailyChests(state: AppState, date: LocalDateKey): AppState {
  return state.household.playerIds.reduce((next, playerId) => initializeDailyChest(next, playerId, date), state);
}

export function isMeaningfulForChest(quest: Quest): boolean { return quest.estimatedMinutes >= MEANINGFUL_MIN_MINUTES && quest.xpReward >= MEANINGFUL_MIN_XP; }

export function recordDailyChestQuest(state: AppState, playerId: PlayerId, quest: Quest, date: LocalDateKey): { state: AppState; unlocked: boolean } {
  let next = initializeDailyChest(state, playerId, date); const chest = next.players[playerId]?.dailyChest;
  if (!chest || chest.status === "claimed" || !isMeaningfulForChest(quest)) return { state: next, unlocked: false };
  const template = quest.templateId ?? quest.id;
  const duplicateTemplate = chest.qualifyingQuestIds.some((id) => { const prior = next.household.quests.find((item) => item.id === id); return (prior?.templateId ?? prior?.id) === template; });
  if (duplicateTemplate || chest.qualifyingQuestIds.includes(quest.id)) return { state: next, unlocked: false };
  const qualifyingQuestIds = [...chest.qualifyingQuestIds, quest.id];
  const unlocked = qualifyingQuestIds.length >= DAILY_CHEST_QUESTS && chest.status !== "ready";
  next = updatePlayer(next, playerId, (player) => ({ ...player, dailyChest: { ...player.dailyChest, qualifyingQuestIds, status: qualifyingQuestIds.length >= DAILY_CHEST_QUESTS ? "ready" : "locked" } }));
  return { state: next, unlocked };
}

export interface ChestClaimResult { state: AppState; claimed: boolean; playerLevel?: number; homeLevel?: number }
export function claimDailyChest(state: AppState, playerId: PlayerId, claimedAt: string): ChestClaimResult {
  const date = toLocalDateKey(new Date(claimedAt)); const current = initializeDailyChest(state, playerId, date); const player = current.players[playerId];
  if (!player || player.dailyChest.status !== "ready") return { state: current, claimed: false };
  const oldPlayer = getLevelProgress(player.progression.totalXp).level; const oldHome = getHomeLevelProgress(current.household.homeProgression).level;
  let next = updatePlayer(current, playerId, (active) => ({ ...active, coins: active.coins + DAILY_CHEST_COINS, progression: { ...active.progression, totalXp: active.progression.totalXp + DAILY_CHEST_PLAYER_XP }, dailyChest: { ...active.dailyChest, status: "claimed" as const, claimedAt } }));
  next = { ...next, household: { ...next.household, homeProgression: { totalXp: next.household.homeProgression.totalXp + DAILY_CHEST_HOME_XP } } };
  const playerLevel = getLevelProgress(next.players[playerId].progression.totalXp).level; const homeLevel = getHomeLevelProgress(next.household.homeProgression).level;
  return { state: next, claimed: true, playerLevel: playerLevel > oldPlayer ? playerLevel : undefined, homeLevel: homeLevel > oldHome ? homeLevel : undefined };
}
