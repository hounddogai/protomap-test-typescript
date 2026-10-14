import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakBudget } from "./streak-budget.js";

test("StreakBudget starts in idle", () => {
  const item = newStreakBudget("code-74", "name-514");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakBudget moves to warming", () => {
  const item = newStreakBudget("code-74", "name-514");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StreakBudget rejects moves from stopped", () => {
  const item = newStreakBudget("code-74", "name-514");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
