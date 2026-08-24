import { expect, test } from "@playwright/test";
import { createSeedState } from "../src/data/seed";
import { STORAGE_KEY } from "../src/persistence/store";
import { schemaV4Fixture } from "../src/persistence/fixtures";
import { serializeBackup } from "../src/domain/backup";
import { addDays, toLocalDateKey } from "../src/domain/dates";

async function withSave(page: import("@playwright/test").Page, state: unknown) {
  await page.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(state)]);
}

async function openProfile(page: import("@playwright/test").Page, projectName: string) {
  await page.getByLabel(projectName === "mobile" ? "Mobile navigation" : "Primary navigation").getByRole("button", { name: "Progress" }).click();
}

async function switchTo(page: import("@playwright/test").Page, projectName: string, playerName: string) {
  const switcher = projectName === "mobile" ? page.locator(".mobile-topbar .player-switcher") : page.locator(".sidebar .player-switcher");
  await switcher.getByRole("button", { name: new RegExp(playerName) }).click();
}

test("fresh two-player onboarding persists a household", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Household name").fill("Adventure House"); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Adventurer 1 name").fill("Alex"); await page.getByRole("button", { name: "Add another adventurer" }).click(); await page.getByLabel("Adventurer 2 name").fill("Morgan"); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Dishes & kitchen" }).click(); await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Enter HomeQuest" }).click();
  await expect(page.getByRole("heading", { name: "Alex" })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Alex" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Morgan's character/ }).first()).toBeVisible();
});

test("Home Quick Complete uses canonical rewards and persists", async ({ page }) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  await page.getByRole("button", { name: "Quick complete Run the dishwasher" }).click();
  await expect(page.getByRole("status")).toContainText("Tyler completed a quest");
  await expect(page.getByRole("status")).toContainText("Our Home");
  await expect(page.getByRole("status")).toContainText("Kitchen");
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).players["player-tyler"].progression.totalXp, STORAGE_KEY))).toBeGreaterThan(before.players["player-tyler"].progression.totalXp);
  await page.reload();
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(after.players["player-tyler"].progression.totalXp).toBeGreaterThan(before.players["player-tyler"].progression.totalXp);
  expect(after.players["player-rachel"].progression.totalXp).toBe(before.players["player-rachel"].progression.totalXp);
  expect(after.household.quests.find((quest: { id: string }) => quest.id === "dishwasher").completedByPlayerId).toBe("player-tyler");
});

test("Home opens the persistent Kitchen Zone with condition and progression", async ({ page }) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await expect(page.getByRole("heading", { name: "Kitchen", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /Kitchen Harmony/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Kitchen condition" })).toContainText("Dishes");
  await expect(page.getByText(/Permanent Kitchen progress/)).toBeVisible();
});

test("Home opens the persistent Bathroom Zone with its own condition and progression", async ({ page }) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  await page.getByRole("button", { name: /Enter the Bathroom/ }).click();
  await expect(page.getByRole("heading", { name: "Bathroom", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /Bathroom Harmony/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Bathroom condition" })).toContainText("Toilet");
});

test("Bathroom completion is shared and persists without rewarding the inactive player", async ({ page }) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/"); await page.getByRole("button", { name: /Enter the Bathroom/ }).click();
  await page.locator(".kitchen-quest-list").getByRole("button", { name: "Quick complete Reset the bathroom" }).click();
  await expect(page.getByRole("status")).toContainText("Bathroom");
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.zones.bathroom.totalXp, STORAGE_KEY))).toBeGreaterThan(state.household.zones.bathroom.totalXp);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.household.zones.bathroom.condition.toilet).toBeGreaterThan(state.household.zones.bathroom.condition.toilet);
  expect(saved.players["player-rachel"].progression.totalXp).toBe(state.players["player-rachel"].progression.totalXp);
});

test("Tyler completion improves the shared Kitchen once and persists without rewarding Rachel", async ({ page }) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/");
  await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await page.locator(".kitchen-quest-list").getByRole("button", { name: "Quick complete Run the dishwasher" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.zones.kitchen.totalXp, STORAGE_KEY))).toBeGreaterThan(state.household.zones.kitchen.totalXp);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.household.zones.kitchen.condition.dishes).toBeGreaterThan(state.household.zones.kitchen.condition.dishes);
  expect(saved.players["player-tyler"].progression.totalXp).toBeGreaterThan(state.players["player-tyler"].progression.totalXp);
  expect(saved.players["player-rachel"].progression.totalXp).toBe(state.players["player-rachel"].progression.totalXp);
  await page.reload(); await expect(page.getByRole("button", { name: /Enter the Kitchen/ })).toContainText(`${saved.household.zones.kitchen.totalXp >= 100 ? "Settled Kitchen" : "Basic Kitchen"}`);
});

test("Rachel Quick Complete isolates personal rewards while progressing the shared Kitchen", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/");
  await switchTo(page, testInfo.project.name, "Rachel"); await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await page.locator(".kitchen-quest-list").getByRole("button", { name: "Quick complete Wipe kitchen counters" }).click();
  const saved = await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)).toMatchObject({ session: { activePlayerId: "player-rachel" } });
  void saved;
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(after.players["player-rachel"].progression.totalXp).toBeGreaterThan(state.players["player-rachel"].progression.totalXp);
  expect(after.players["player-tyler"].progression.totalXp).toBe(state.players["player-tyler"].progression.totalXp);
  expect(after.household.zones.kitchen.totalXp).toBeGreaterThan(state.household.zones.kitchen.totalXp);
});

test("Comeback remains a welcoming Quick Complete path after inactivity", async ({ page }) => {
  const now = new Date(); const staleDate = addDays(toLocalDateKey(now), -4); const state = createSeedState(now);
  state.household.questTemplates = state.household.questTemplates.filter((template) => template.id === "dishwasher");
  state.household.quests = state.household.quests.filter((quest) => quest.id === "dishwasher").map((quest) => ({ ...quest, occurrenceDate: staleDate }));
  state.household.lifecycle.lastLifecycleDate = staleDate; state.household.lifecycle.lastOpenedDate = staleDate;
  state.players["player-tyler"].dailyContext = { date: staleDate, energy: "low", availableMinutes: 15 };
  await withSave(page, state); await page.goto("/");
  await expect(page.locator(".recommendation").getByRole("heading", { name: "Reset one space" })).toBeVisible();
  await page.locator(".recommendation").getByRole("button", { name: "Quick complete Reset one space" }).click();
  await expect(page.getByRole("status")).toContainText("Reset one space");
  await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.quests.find((quest: { kind?: string }) => quest.kind === "comeback")?.status, STORAGE_KEY)).toBe("completed");
});

test("Kitchen decoration purchase is paid personally, shared across players, and persistent", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/"); await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await page.getByRole("button", { name: "Buy Coffee Station" }).click(); await page.getByRole("button", { name: "Equip Coffee Station" }).click();
  await expect(page.locator(".coffee-station")).toBeVisible();
  await switchTo(page, testInfo.project.name, "Rachel"); await expect(page.locator(".coffee-station")).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.players["player-tyler"].coins).toBe(state.players["player-tyler"].coins - 28); expect(saved.players["player-rachel"].coins).toBe(state.players["player-rachel"].coins);
  expect(saved.household.zones.kitchen.cosmetics.equippedDecorationIds.counter).toBe("coffee-station");
  await page.reload(); await page.getByRole("button", { name: /Enter the Kitchen/ }).click(); await expect(page.locator(".coffee-station")).toBeVisible();
});

test("invalid backup displays an error without changing the current household", async ({ page }, testInfo) => {
  const seed = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, seed); await page.goto("/");
  await openProfile(page, testInfo.project.name);
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.getByLabel("Import HomeQuest backup").setInputFiles({ name: "not-a-backup.json", mimeType: "application/json", buffer: Buffer.from("{bad") });
  await expect(page.getByText("This file is not valid JSON.")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
});

test("a v4 fixture migrates to the existing household without onboarding", async ({ page }) => {
  await withSave(page, schemaV4Fixture()); await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tyler" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Rachel's character/ }).first()).toBeVisible();
});

test("Character Studio saves a multi-option Tyler look and persists it", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByRole("tab", { name: "Character" }).click();
  await page.getByRole("button", { name: "Hair style: Curls" }).click(); await page.getByRole("button", { name: "Hair color: Copper" }).click();
  await page.getByRole("tab", { name: "Outfit" }).click(); await page.getByRole("button", { name: "Outfit: Jacket" }).click();
  await page.getByRole("tab", { name: "Accessory" }).click(); await page.getByRole("button", { name: "Accessory: Cap" }).click();
  await page.getByRole("button", { name: "Save character" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).players["player-tyler"].avatar.hairColor, STORAGE_KEY))).toBe("copper");
  await page.reload();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.players["player-tyler"].avatar).toMatchObject({ hairStyle: "curls", hairColor: "copper", outfit: "jacket", accessory: "cap" });
  expect(saved.players["player-rachel"].avatar).toEqual(state.players["player-rachel"].avatar);
});

test("Rachel customization remains independent and player switching updates the profile", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/");
  await switchTo(page, testInfo.project.name, "Rachel");
  await expect(page.locator('.home-scene .scene-avatar[data-character="Rachel"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator('.home-scene .scene-avatar[data-character="Tyler"]')).toHaveAttribute("data-active", "false");
  await openProfile(page, testInfo.project.name);
  await expect(page.locator(".profile-hero").getByRole("heading", { name: "Rachel" })).toBeVisible();
  await page.getByRole("tab", { name: "Character" }).click();
  await page.getByRole("button", { name: "Hair style: Ponytail" }).click();
  await page.getByRole("tab", { name: "Outfit" }).click(); await page.getByRole("button", { name: "Outfit: Apron" }).click();
  await page.getByRole("tab", { name: "Accessory" }).click(); await page.getByRole("button", { name: "Accessory: Hair clip" }).click();
  await page.getByRole("button", { name: "Save character" }).click();
  const saved = await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)).toMatchObject({ session: { activePlayerId: "player-rachel" } }); void saved;
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(after.players["player-rachel"].avatar).toMatchObject({ hairStyle: "ponytail", outfit: "apron", accessory: "hair-clip" });
  expect(after.players["player-tyler"].avatar).toEqual(state.players["player-tyler"].avatar);
});

test("Home and both Zones render two dedicated Scene avatars", async ({ page }) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  await expect(page.locator(".home-scene .scene-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: /Enter the Kitchen/ }).click(); await expect(page.locator(".kitchen-scene .scene-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: "Our Home" }).click(); await page.getByRole("button", { name: /Enter the Bathroom/ }).click(); await expect(page.locator(".bathroom-scene .scene-avatar")).toHaveCount(2);
});

test("reduced motion preserves completion feedback and character state meaning", async ({ page }, testInfo) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByRole("switch").click(); await expect(page.locator(".app-shell")).toHaveAttribute("data-reduced-motion", "true");
  if (testInfo.project.name === "mobile") { await page.getByRole("button", { name: "Open menu" }).click(); await page.getByLabel("Primary navigation").getByRole("button", { name: "Home", exact: true }).click(); }
  else await page.getByLabel("Primary navigation").getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Quick complete Run the dishwasher" }).first().click();
  await expect(page.getByRole("status")).toContainText("Tyler completed a quest");
  await expect(page.locator('.home-scene .scene-avatar[data-character="Tyler"]')).toHaveCount(1);
});

test("Character System primary views have no unexpected browser warnings or errors", async ({ page }, testInfo) => {
  const unexpected: string[] = [];
  page.on("console", (message) => { if (["warning", "error"].includes(message.type())) unexpected.push(`${message.type()}: ${message.text()}`); });
  page.on("pageerror", (error) => unexpected.push(`pageerror: ${error.message}`));
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  await expect(page.locator(".home-scene .scene-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: /Enter the Kitchen/ }).click(); await expect(page.locator(".kitchen-scene .scene-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: "Our Home" }).click(); await page.getByRole("button", { name: /Enter the Bathroom/ }).click(); await expect(page.locator(".bathroom-scene .scene-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: "Our Home" }).click(); await openProfile(page, testInfo.project.name); await page.getByRole("tab", { name: "Character" }).click();
  await expect(page.getByTestId("character-studio")).toBeVisible();
  expect(unexpected).toEqual([]);
});

test("Daily Chest claim is persistent and idempotent", async ({ page }) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); state.players["player-tyler"].dailyChest = { date: "2026-08-23", qualifyingQuestIds: ["dishwasher", "counters"], status: "ready" }; const coins = state.players["player-tyler"].coins;
  await withSave(page, state); await page.goto("/"); await page.getByRole("button", { name: "Open chest" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).players["player-tyler"].dailyChest.status, STORAGE_KEY))).toBe("claimed");
  await page.reload(); const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.players["player-tyler"].coins).toBe(coins + 20); expect(saved.players["player-tyler"].dailyChest.status).toBe("claimed"); await expect(page.getByText("Claimed today")).toBeVisible();
});

test("a confirmed backup restore replaces the current isolated save", async ({ page }, testInfo) => {
  const original = createSeedState(new Date(2026, 7, 23, 10)); original.household.name = "Restored Home"; original.household.zones.kitchen.totalXp = 777; original.household.zones.kitchen.condition.food = 23; original.household.cosmetics.ownedIds.push("coffee-station"); original.household.zones.kitchen.cosmetics.equippedDecorationIds.counter = "coffee-station"; const current = createSeedState(new Date(2026, 7, 23, 10)); current.household.name = "Changed Home";
  await withSave(page, current); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByLabel("Import HomeQuest backup").setInputFiles({ name: "homequest-backup.json", mimeType: "application/json", buffer: Buffer.from(serializeBackup(original, new Date(2026, 7, 23, 10))) });
  await expect(page.getByText("Restore this backup?")).toBeVisible(); await expect(page.getByText(/Kitchen Level/)).toBeVisible(); await page.getByRole("button", { name: "Replace current save" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.name, STORAGE_KEY))).toBe("Restored Home");
  const restored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY); expect(restored.household.zones.kitchen).toMatchObject({ totalXp: 777, condition: { food: 23 }, cosmetics: { equippedDecorationIds: { counter: "coffee-station" } } });
});

test("a confirmed reset returns an isolated context to onboarding", async ({ page }, testInfo) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByRole("button", { name: "Reset HomeQuest…" }).click(); await page.getByRole("button", { name: "Confirm full reset" }).click();
  await expect(page.getByRole("heading", { name: "Welcome to HomeQuest" })).toBeVisible();
});
