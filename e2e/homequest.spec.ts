import { expect, test } from "@playwright/test";
import { createSeedState } from "../src/data/seed";
import { STORAGE_KEY } from "../src/persistence/store";
import { schemaV4Fixture } from "../src/persistence/fixtures";

async function withSave(page: import("@playwright/test").Page, state: unknown) {
  await page.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [STORAGE_KEY, JSON.stringify(state)]);
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
  await page.getByLabel(testInfo.project.name === "mobile" ? "Mobile navigation" : "Primary navigation").getByRole("button", { name: "Progress" }).click();
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
