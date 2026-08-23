import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { equipCosmetic, purchaseCosmetic } from "./cosmetics";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "./players";

describe("cosmetic economy", () => {
  it("purchases once with sufficient coins and prevents duplicate or unaffordable buys", () => {
    const state = createSeedState(); const bought = purchaseCosmetic(state, "monstera-plant", TYLER_PLAYER_ID);
    expect(bought.ok).toBe(true); expect(bought.state.players[TYLER_PLAYER_ID].coins).toBe(state.players[TYLER_PLAYER_ID].coins - 35);
    expect(purchaseCosmetic(bought.state, "monstera-plant", TYLER_PLAYER_ID).reason).toBe("owned");
    const poor = { ...state, players: { ...state.players, [TYLER_PLAYER_ID]: { ...state.players[TYLER_PLAYER_ID], coins: 1 } } };
    expect(purchaseCosmetic(poor, "morning-grove", TYLER_PLAYER_ID).reason).toBe("coins");
  });
  it("only equips owned themes and persists equipped decorations in state", () => {
    const state = createSeedState(); expect(equipCosmetic(state, "morning-grove", TYLER_PLAYER_ID)).toBe(state);
    const morning = purchaseCosmetic(state, "morning-grove", TYLER_PLAYER_ID).state; expect(equipCosmetic(morning, "morning-grove", TYLER_PLAYER_ID).household.cosmetics.equippedThemeId).toBe("morning-grove");
    const plant = purchaseCosmetic(state, "monstera-plant", TYLER_PLAYER_ID).state; expect(equipCosmetic(plant, "monstera-plant", TYLER_PLAYER_ID).household.cosmetics.equippedDecorationIds.plant).toBe("monstera-plant");
  });
  it("uses the acting player's coins for a household-owned Kitchen decoration", () => {
    const state = createSeedState(); state.players[RACHEL_PLAYER_ID].coins = 40;
    const bought = purchaseCosmetic(state, "coffee-station", RACHEL_PLAYER_ID);
    expect(bought.ok).toBe(true); expect(bought.state.players[RACHEL_PLAYER_ID].coins).toBe(12); expect(bought.state.players[TYLER_PLAYER_ID].coins).toBe(state.players[TYLER_PLAYER_ID].coins);
    expect(bought.state.household.cosmetics.ownedIds).toContain("coffee-station");
    const equipped = equipCosmetic(bought.state, "coffee-station", TYLER_PLAYER_ID);
    expect(equipped.household.zones.kitchen.cosmetics.equippedDecorationIds.counter).toBe("coffee-station");
  });
  it("fails safely when the acting player cannot afford shared Kitchen decor", () => {
    const state = createSeedState(); state.players[RACHEL_PLAYER_ID].coins = 2;
    expect(purchaseCosmetic(state, "coffee-station", RACHEL_PLAYER_ID)).toMatchObject({ ok: false, reason: "coins", state });
  });
});
