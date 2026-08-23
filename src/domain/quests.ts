import { completeQuestTransaction } from "./completion";
export { applyHomeStatEffects } from "./home-state";
import type { AppState } from "./types";

export function completeQuest(state: AppState, questId: string, completedAt?: string): AppState {
  if (!completedAt) return state;
  return completeQuestTransaction(state, questId, completedAt).state;
}
