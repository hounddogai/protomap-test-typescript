import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutBudget } from "./payout-budget.js";

test("PayoutBudget starts in idle", () => {
  const item = newPayoutBudget("code-179", "name-10");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutBudget moves to draining", () => {
  const item = newPayoutBudget("code-179", "name-10");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PayoutBudget rejects moves from stopped", () => {
  const item = newPayoutBudget("code-179", "name-10");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
