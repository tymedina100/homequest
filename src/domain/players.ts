import type { AppState, PlayerId, PlayerState } from "./types";

export const TYLER_PLAYER_ID = "player-tyler";
export const RACHEL_PLAYER_ID = "player-rachel";
export const HOUSEHOLD_ID = "household-tyler-rachel";

export function getPlayer(state: AppState, playerId: PlayerId): PlayerState | undefined {
  return state.players[playerId];
}

export function getActivePlayer(state: AppState): PlayerState {
  return state.players[state.session.activePlayerId] ?? state.players[state.household.playerIds[0]];
}

export function updatePlayer(
  state: AppState,
  playerId: PlayerId,
  update: (player: PlayerState) => PlayerState,
): AppState {
  const player = state.players[playerId];
  if (!player) return state;
  return { ...state, players: { ...state.players, [playerId]: update(player) } };
}

export function contributionCounts(state: AppState, questIds?: Set<string>): Record<PlayerId, number> {
  const counts = Object.fromEntries(state.household.playerIds.map((id) => [id, 0])) as Record<PlayerId, number>;
  for (const entry of state.household.lifecycle.questHistory) {
    if (entry.event !== "completed" || !entry.playerId || (questIds && !questIds.has(entry.questId))) continue;
    counts[entry.playerId] = (counts[entry.playerId] ?? 0) + 1;
  }
  return counts;
}
