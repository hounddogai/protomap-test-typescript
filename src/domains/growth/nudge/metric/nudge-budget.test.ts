import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeBudget } from "./nudge-budget.js";

test("NudgeBudget starts in idle", () => {
  const item = newNudgeBudget("code-757", "label-4");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeBudget moves to stopped", () => {
  const item = newNudgeBudget("code-757", "label-4");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("NudgeBudget rejects moves from stopped", () => {
  const item = newNudgeBudget("code-757", "label-4");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
