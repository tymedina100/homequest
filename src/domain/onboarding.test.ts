import { describe, expect, it } from "vitest";
import { createOnboardedState, createOnboardingPlayer, suggestedStarterTemplateIds } from "./onboarding";

describe("household onboarding", () => {
  it("creates a one-player household with stable local identity and starter templates", () => {
    const alex = createOnboardingPlayer("Alex", 1);
    const state = createOnboardedState({ householdName: "Apartment Quest", players: [alex], priorities: ["kitchen", "cleaning"], starterTemplateIds: suggestedStarterTemplateIds(["kitchen", "cleaning"]) }, new Date(2026, 7, 23, 10));
    expect(state.household).toMatchObject({ id: "household-apartment-quest", name: "Apartment Quest", playerIds: ["player-alex-1"] });
    expect(state.players[alex.id]).toMatchObject({ name: "Alex", coins: 0, progression: { totalXp: 0 } });
    expect(state.household.zones.kitchen).toMatchObject({ totalXp: 0, condition: { dishes: 50, counters: 50, floor: 50, trash: 50, food: 50 } });
    expect(state.household.questTemplates.length).toBeGreaterThan(0);
  });

  it("keeps multiple players’ progression independent from the shared household", () => {
    const sam = createOnboardingPlayer("Sam", 1); const jordan = createOnboardingPlayer("Jordan", 2);
    const state = createOnboardedState({ householdName: "Our Home", players: [sam, jordan], priorities: [], starterTemplateIds: ["dishwasher", "laundry"] }, new Date(2026, 7, 23, 10));
    expect(state.household.playerIds).toEqual([sam.id, jordan.id]);
    expect(state.players[sam.id].progression).not.toBe(state.players[jordan.id].progression);
    expect(state.session.activePlayerId).toBe(sam.id);
  });
});
