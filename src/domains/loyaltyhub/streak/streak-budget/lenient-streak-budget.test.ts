import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakBudget } from "./lenient-streak-budget.js";

test("LenientStreakBudget starts in new", () => {
  const item = newLenientStreakBudget("code-63", "title-894");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakBudget moves to queued", () => {
  const item = newLenientStreakBudget("code-63", "title-894");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientStreakBudget rejects moves from failed", () => {
  const item = newLenientStreakBudget("code-63", "title-894");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
