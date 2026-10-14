import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStreakBudget } from "./pending-streak-budget.js";

test("PendingStreakBudget starts in idle", () => {
  const item = newPendingStreakBudget("code-88", "title-946");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStreakBudget moves to warming", () => {
  const item = newPendingStreakBudget("code-88", "title-946");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingStreakBudget rejects moves from stopped", () => {
  const item = newPendingStreakBudget("code-88", "title-946");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
