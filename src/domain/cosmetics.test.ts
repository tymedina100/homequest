import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { equipCosmetic, purchaseCosmetic } from "./cosmetics";

describe("cosmetic economy", () => {
  it("purchases once with sufficient coins and prevents duplicate or unaffordable buys", () => {
    const state = createSeedState(); const bought = purchaseCosmetic(state, "monstera-plant");
    expect(bought.ok).toBe(true); expect(bought.state.player.coins).toBe(state.player.coins - 35);
    expect(purchaseCosmetic(bought.state, "monstera-plant").reason).toBe("owned");
    expect(purchaseCosmetic({ ...state, player: { ...state.player, coins: 1 } }, "morning-grove").reason).toBe("coins");
  });
  it("only equips owned themes and persists equipped decorations in state", () => {
    const state = createSeedState(); expect(equipCosmetic(state, "morning-grove")).toBe(state);
    const morning = purchaseCosmetic(state, "morning-grove").state; expect(equipCosmetic(morning, "morning-grove").cosmetics.equippedThemeId).toBe("morning-grove");
    const plant = purchaseCosmetic(state, "monstera-plant").state; expect(equipCosmetic(plant, "monstera-plant").cosmetics.equippedDecorationIds.plant).toBe("monstera-plant");
  });
});
