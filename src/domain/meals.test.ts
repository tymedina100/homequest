import { describe, expect, it } from "vitest";
import { createSeedState, recipes } from "@/data/seed";
import { matchRecipe, suggestMeals } from "./meals";

describe("meal matching", () => {
  it("matches ingredient aliases against inventory", () => {
    const result = matchRecipe(recipes[0], createSeedState().inventory);
    expect(result.missing).toEqual([]);
    expect(result.ratio).toBe(1);
  });

  it("returns a bounded trio with useful suggestion types", () => {
    const result = suggestMeals(recipes, createSeedState().inventory);
    expect(result).toHaveLength(3);
    expect(result.map((item) => item.kind)).toEqual(["easiest", "use-it-up", "comfort"]);
    expect(result.every((item) => item.reason.length > 10)).toBe(true);
  });
});
