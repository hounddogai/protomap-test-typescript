import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardBudget } from "./seasonal-reward-budget.js";

test("SeasonalRewardBudget starts in created", () => {
  const item = newSeasonalRewardBudget("code-488", "label-301");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardBudget moves to published", () => {
  const item = newSeasonalRewardBudget("code-488", "label-301");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalRewardBudget rejects moves from retired", () => {
  const item = newSeasonalRewardBudget("code-488", "label-301");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
