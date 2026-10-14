import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRetentionBudget } from "./tiered-retention-budget.js";

test("TieredRetentionBudget starts in planned", () => {
  const item = newTieredRetentionBudget("code-340", "label-638");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRetentionBudget moves to in progress", () => {
  const item = newTieredRetentionBudget("code-340", "label-638");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredRetentionBudget rejects moves from cancelled", () => {
  const item = newTieredRetentionBudget("code-340", "label-638");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
