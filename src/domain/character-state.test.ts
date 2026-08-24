import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { actionCueForQuest, characterStateForPlayer, momentForCompletion } from "./character-state";
import type { CompletionSummary } from "./completion";

const summary = (changes: Partial<CompletionSummary> = {}): CompletionSummary => ({
  playerName: "Tyler", questTitle: "Run the dishwasher", playerXp: 30, skill: "cleaning", skillXp: 15, homeXp: 8, coins: 3,
  kitchenXp: 8, bathroomXp: 0, perkIds: [], achievementIds: [], cosmeticIds: [], chestUnlocked: false, ...changes,
});

describe("temporary character state", () => {
  it("derives Zone action cues from structured effects", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const dishwasher = state.household.quests.find((quest) => quest.id === "dishwasher")!;
    const bathroom = state.household.quests.find((quest) => quest.zoneId === "bathroom")!;
    expect(actionCueForQuest(dishwasher)).toBe("sink");
    expect(actionCueForQuest(bathroom)).toBe("toilet");
  });

  it("uses restrained ordinary, Comeback, and shared level-up moments", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const quest = state.household.quests.find((candidate) => candidate.id === "dishwasher")!;
    expect(momentForCompletion(quest, summary(), "player-tyler", 1)).toMatchObject({ state: "working", shared: false, cue: "sink" });
    expect(momentForCompletion({ ...quest, kind: "comeback" }, summary(), "player-tyler", 2).state).toBe("welcome");
    expect(momentForCompletion(quest, summary({ kitchenLevel: 3 }), "player-tyler", 3)).toMatchObject({ state: "levelUp", shared: true });
  });

  it("never mutates the saved base expression when runtime state changes", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const player = state.players["player-tyler"];
    const base = player.avatar.expression;
    const moment = { id: 1, playerId: player.id, state: "celebrate" as const, shared: false, cue: "home" as const };
    expect(characterStateForPlayer(moment, player.id, player.dailyContext.energy)).toBe("celebrate");
    expect(player.avatar.expression).toBe(base);
    expect(characterStateForPlayer(null, player.id, "good")).toBe("idle");
    expect(characterStateForPlayer(null, player.id, "drained")).toBe("sleepy");
  });
});
