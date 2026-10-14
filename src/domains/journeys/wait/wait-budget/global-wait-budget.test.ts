import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWaitBudget } from "./global-wait-budget.js";

test("GlobalWaitBudget starts in new", () => {
  const item = newGlobalWaitBudget("code-250", "label-572");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWaitBudget moves to queued", () => {
  const item = newGlobalWaitBudget("code-250", "label-572");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("GlobalWaitBudget rejects moves from failed", () => {
  const item = newGlobalWaitBudget("code-250", "label-572");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
