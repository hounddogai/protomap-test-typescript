import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionBudget } from "./retention-budget.js";

test("RetentionBudget starts in planned", () => {
  const item = newRetentionBudget("code-715", "title-205");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionBudget moves to in progress", () => {
  const item = newRetentionBudget("code-715", "title-205");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RetentionBudget rejects moves from cancelled", () => {
  const item = newRetentionBudget("code-715", "title-205");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
