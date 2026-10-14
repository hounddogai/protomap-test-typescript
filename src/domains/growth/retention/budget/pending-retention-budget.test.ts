import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRetentionBudget } from "./pending-retention-budget.js";

test("PendingRetentionBudget starts in open", () => {
  const item = newPendingRetentionBudget("code-378", "label-816");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRetentionBudget moves to in review", () => {
  const item = newPendingRetentionBudget("code-378", "label-816");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingRetentionBudget rejects moves from archived", () => {
  const item = newPendingRetentionBudget("code-378", "label-816");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
