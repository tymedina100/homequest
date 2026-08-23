import type { InventoryItem, MealSuggestion, Recipe } from "./types";

const normalize = (value: string) => value.toLowerCase().trim();

function hasIngredient(items: InventoryItem[], ingredient: string) {
  const target = normalize(ingredient);
  return items.some((item) =>
    [item.name, ...item.ingredientTags].some((value) => normalize(value).includes(target) || target.includes(normalize(value))),
  );
}

export function matchRecipe(recipe: Recipe, inventory: InventoryItem[]) {
  const available = recipe.ingredients.filter((ingredient) => hasIngredient(inventory, ingredient));
  const missing = recipe.ingredients.filter((ingredient) => !hasIngredient(inventory, ingredient));
  return { available, missing, ratio: available.length / recipe.ingredients.length };
}

export function suggestMeals(recipes: Recipe[], inventory: InventoryItem[]): MealSuggestion[] {
  const matches = recipes.map((recipe) => ({ recipe, ...matchRecipe(recipe, inventory) }));
  const easiest = [...matches].sort((a, b) => a.recipe.prepMinutes - b.recipe.prepMinutes || b.ratio - a.ratio)[0];
  const useSoonNames = inventory.filter((item) => item.useSoon).map((item) => normalize(item.name));
  const useItUp = [...matches].sort((a, b) => {
    const count = (entry: typeof a) => entry.recipe.ingredients.filter((ingredient) => useSoonNames.some((name) => normalize(ingredient).includes(name) || name.includes(normalize(ingredient)))).length;
    return count(b) - count(a) || b.ratio - a.ratio;
  })[0];
  const comfort = [...matches].sort((a, b) => Number(Boolean(b.recipe.favorite)) - Number(Boolean(a.recipe.favorite)) || b.ratio - a.ratio)[0];

  const selected = [
    { match: easiest, kind: "easiest" as const, reason: "The quickest path to something warm and satisfying." },
    { match: useItUp, kind: "use-it-up" as const, reason: "Uses ingredients that deserve a spot at the front of the line." },
    { match: comfort, kind: "comfort" as const, reason: "A familiar favorite with most ingredients already at home." },
  ];

  return selected.map(({ match, kind, reason }) => ({
    recipe: match.recipe,
    available: match.available,
    missing: match.missing,
    kind,
    reason,
    score: Math.round(match.ratio * 100),
  }));
}
