import type { CompletionSummary } from "./completion";
import type { CharacterActionCue, CharacterAnimationState, DailyEnergy, PlayerId, Quest } from "./types";

export interface CharacterMoment {
  id: number;
  playerId: PlayerId;
  state: CharacterAnimationState;
  shared: boolean;
  cue: CharacterActionCue;
}

export function actionCueForQuest(quest: Quest): CharacterActionCue {
  if (quest.zoneId === "kitchen") {
    if ((quest.zoneEffects?.food ?? 0) > 0 || quest.category === "cooking") return "stove";
    return "sink";
  }
  if (quest.zoneId === "bathroom") {
    if ((quest.zoneEffects?.supplies ?? 0) > 0) return "supplies";
    if ((quest.zoneEffects?.toilet ?? 0) > 0) return "toilet";
    return "sink";
  }
  return "home";
}

export function momentForCompletion(quest: Quest, summary: CompletionSummary, playerId: PlayerId, id: number): CharacterMoment {
  const leveled = Boolean(summary.playerLevel || summary.skillLevel || summary.homeLevel || summary.kitchenLevel || summary.bathroomLevel);
  const shared = Boolean(summary.homeLevel || summary.kitchenLevel || summary.bathroomLevel || quest.kind === "rescue");
  const state: CharacterAnimationState = leveled ? "levelUp" : quest.kind === "comeback" ? "welcome" : quest.kind === "rescue" || summary.chestUnlocked ? "celebrate" : "working";
  return { id, playerId, state, shared, cue: actionCueForQuest(quest) };
}

export function characterStateForPlayer(moment: CharacterMoment | null, playerId: PlayerId, energy: DailyEnergy, focused = false): CharacterAnimationState {
  if (moment && (moment.playerId === playerId || moment.shared)) return moment.playerId === playerId ? moment.state : "celebrate";
  if (energy === "drained") return "sleepy";
  return focused ? "focused" : "idle";
}
