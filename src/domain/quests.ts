import { completeQuestTransaction } from "./completion";
export { applyHomeStatEffects } from "./home-state";
import type { AppState, PlayerId } from "./types";

export function completeQuest(state: AppState, questId: string, playerId: PlayerId, completedAt?: string): AppState {
  if (!completedAt) return state;
  return completeQuestTransaction(state, questId, playerId, completedAt).state;
}
