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
  const original = createSeedState(new Date(2026, 7, 23, 10)); original.household.name = "Restored Home"; const current = createSeedState(new Date(2026, 7, 23, 10)); current.household.name = "Changed Home";
  await withSave(page, current); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByLabel("Import HomeQuest backup").setInputFiles({ name: "homequest-backup.json", mimeType: "application/json", buffer: Buffer.from(serializeBackup(original, new Date(2026, 7, 23, 10))) });
  await expect(page.getByText("Restore this backup?")).toBeVisible(); await page.getByRole("button", { name: "Replace current save" }).click();
  await expect.poll(async () => (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).household.name, STORAGE_KEY))).toBe("Restored Home");
});

test("a confirmed reset returns an isolated context to onboarding", async ({ page }, testInfo) => {
  await withSave(page, createSeedState(new Date(2026, 7, 23, 10))); await page.goto("/"); await openProfile(page, testInfo.project.name);
  await page.getByRole("button", { name: "Reset HomeQuest…" }).click(); await page.getByRole("button", { name: "Confirm full reset" }).click();
  await expect(page.getByRole("heading", { name: "Welcome to HomeQuest" })).toBeVisible();
});
