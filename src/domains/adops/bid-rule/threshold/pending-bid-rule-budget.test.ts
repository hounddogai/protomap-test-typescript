import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBidRuleBudget } from "./pending-bid-rule-budget.js";

test("PendingBidRuleBudget starts in planned", () => {
  const item = newPendingBidRuleBudget("code-81", "name-556");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBidRuleBudget moves to scheduled", () => {
  const item = newPendingBidRuleBudget("code-81", "name-556");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PendingBidRuleBudget rejects moves from cancelled", () => {
  const item = newPendingBidRuleBudget("code-81", "name-556");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
