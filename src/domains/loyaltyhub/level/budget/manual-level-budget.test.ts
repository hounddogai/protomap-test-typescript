import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLevelBudget } from "./manual-level-budget.js";

test("ManualLevelBudget starts in draft", () => {
  const item = newManualLevelBudget("code-479", "title-167");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLevelBudget moves to suspended", () => {
  const item = newManualLevelBudget("code-479", "title-167");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ManualLevelBudget rejects moves from closed", () => {
  const item = newManualLevelBudget("code-479", "title-167");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
