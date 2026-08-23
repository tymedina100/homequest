import { expect, test } from "@playwright/test";
import { createSeedState } from "../src/data/seed";
import { STORAGE_KEY } from "../src/persistence/store";
import { schemaV4Fixture } from "../src/persistence/fixtures";
import { serializeBackup } from "../src/domain/backup";

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

test("quest progression and player separation persist", async ({ page }) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/");
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  await page.getByRole("button", { name: /Complete Run the dishwasher/ }).click();
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

test("Tyler completion improves the shared Kitchen once and persists without rewarding Rachel", async ({ page }) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/");
  await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await page.getByRole("button", { name: "Complete Run the dishwasher" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.zones.kitchen.totalXp, STORAGE_KEY))).toBeGreaterThan(state.household.zones.kitchen.totalXp);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.household.zones.kitchen.condition.dishes).toBeGreaterThan(state.household.zones.kitchen.condition.dishes);
  expect(saved.players["player-tyler"].progression.totalXp).toBeGreaterThan(state.players["player-tyler"].progression.totalXp);
  expect(saved.players["player-rachel"].progression.totalXp).toBe(state.players["player-rachel"].progression.totalXp);
  await page.reload(); await expect(page.getByRole("button", { name: /Enter the Kitchen/ })).toContainText(`${saved.household.zones.kitchen.totalXp >= 100 ? "Settled Kitchen" : "Basic Kitchen"}`);
});

test("Rachel earns personal rewards while progressing the same Kitchen", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/");
  await switchTo(page, testInfo.project.name, "Rachel"); await page.getByRole("button", { name: /Enter the Kitchen/ }).click();
  await page.getByRole("button", { name: "Complete Wipe kitchen counters" }).click();
  const saved = await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)).toMatchObject({ session: { activePlayerId: "player-rachel" } });
  void saved;
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(after.players["player-rachel"].progression.totalXp).toBeGreaterThan(state.players["player-rachel"].progression.totalXp);
  expect(after.players["player-tyler"].progression.totalXp).toBe(state.players["player-tyler"].progression.totalXp);
  expect(after.household.zones.kitchen.totalXp).toBeGreaterThan(state.household.zones.kitchen.totalXp);
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

test("character changes persist without changing another player", async ({ page }, testInfo) => {
  const state = createSeedState(new Date(2026, 7, 23, 10)); await withSave(page, state); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByRole("tab", { name: "Character" }).click(); await page.getByRole("button", { name: "Copper", exact: true }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).players["player-tyler"].avatar.hairColor, STORAGE_KEY))).toBe("copper");
  await page.reload();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(saved.players["player-tyler"].avatar.hairColor).toBe("copper"); expect(saved.players["player-rachel"].avatar.hairColor).toBe(state.players["player-rachel"].avatar.hairColor);
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
