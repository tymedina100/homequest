import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { defaultAvatarFor, normalizeAvatar } from "./avatar";
import { completeQuestTransaction } from "./completion";
import { recordDailyChestQuest } from "./daily-chest";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID, updatePlayer } from "./players";

describe("household players", () => {
  it("seeds stable Tyler and Rachel identities with distinct personal defaults", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    expect(state.household.playerIds).toEqual([TYLER_PLAYER_ID, RACHEL_PLAYER_ID]);
    expect(state.players[TYLER_PLAYER_ID]).toMatchObject({ name: "Tyler", progression: { totalXp: 275 } });
    expect(state.players[RACHEL_PLAYER_ID]).toMatchObject({ name: "Rachel", coins: 0, progression: { totalXp: 0 }, achievements: [] });
    expect(state.players[TYLER_PLAYER_ID].avatar).not.toEqual(state.players[RACHEL_PLAYER_ID].avatar);
  });

  it("attributes a shared quest while rewarding only the acting player", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const beforeTyler = structuredClone(state.players[TYLER_PLAYER_ID]); const beforeHomeXp = state.household.homeProgression.totalXp;
    const result = completeQuestTransaction(state, "dishwasher", RACHEL_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.applied).toBe(true);
    expect(result.state.players[TYLER_PLAYER_ID]).toEqual(beforeTyler);
    expect(result.state.players[RACHEL_PLAYER_ID].progression.totalXp).toBe(30);
    expect(result.state.players[RACHEL_PLAYER_ID].skills.cleaning.totalXp).toBeGreaterThan(0);
    expect(result.state.household.homeProgression.totalXp).toBeGreaterThan(beforeHomeXp);
    expect(result.state.household.quests.find((quest) => quest.id === "dishwasher")?.completedByPlayerId).toBe(RACHEL_PLAYER_ID);
  });

  it("keeps each player's context and chest independent", () => {
    let state = createSeedState(new Date(2026, 7, 23, 10));
    state = updatePlayer(state, RACHEL_PLAYER_ID, (player) => ({ ...player, dailyContext: { ...player.dailyContext, energy: "low", availableMinutes: 5 } }));
    state = recordDailyChestQuest(state, RACHEL_PLAYER_ID, state.household.quests[0], "2026-08-23").state;
    expect(state.players[RACHEL_PLAYER_ID].dailyContext).toMatchObject({ energy: "low", availableMinutes: 5 });
    expect(state.players[TYLER_PLAYER_ID].dailyContext).toMatchObject({ energy: "good", availableMinutes: 15 });
    expect(state.players[RACHEL_PLAYER_ID].dailyChest.qualifyingQuestIds).toEqual(["dishwasher"]);
    expect(state.players[TYLER_PLAYER_ID].dailyChest.qualifyingQuestIds).toEqual([]);
  });

  it("normalizes unsupported avatar data to the correct player's defaults", () => {
    expect(normalizeAvatar({ hairStyle: "unknown" as never }, RACHEL_PLAYER_ID)).toEqual(defaultAvatarFor(RACHEL_PLAYER_ID));
    expect(normalizeAvatar({ expression: "focused" }, TYLER_PLAYER_ID).expression).toBe("focused");
  });
});
