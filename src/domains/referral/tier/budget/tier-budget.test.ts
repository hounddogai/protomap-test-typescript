import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierBudget } from "./tier-budget.js";

test("TierBudget starts in planned", () => {
  const item = newTierBudget("code-613", "label-303");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierBudget moves to scheduled", () => {
  const item = newTierBudget("code-613", "label-303");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TierBudget rejects moves from cancelled", () => {
  const item = newTierBudget("code-613", "label-303");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
