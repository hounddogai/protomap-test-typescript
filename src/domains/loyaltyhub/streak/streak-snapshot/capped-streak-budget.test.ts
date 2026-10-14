import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStreakBudget } from "./capped-streak-budget.js";

test("CappedStreakBudget starts in idle", () => {
  const item = newCappedStreakBudget("code-369", "title-981");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStreakBudget moves to warming", () => {
  const item = newCappedStreakBudget("code-369", "title-981");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedStreakBudget rejects moves from stopped", () => {
  const item = newCappedStreakBudget("code-369", "title-981");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
