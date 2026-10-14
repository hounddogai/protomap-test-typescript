import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupBudget } from "./seasonal-warmup-budget.js";

test("SeasonalWarmupBudget starts in draft", () => {
  const item = newSeasonalWarmupBudget("code-796", "name-375");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupBudget moves to pending", () => {
  const item = newSeasonalWarmupBudget("code-796", "name-375");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalWarmupBudget rejects moves from closed", () => {
  const item = newSeasonalWarmupBudget("code-796", "name-375");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
