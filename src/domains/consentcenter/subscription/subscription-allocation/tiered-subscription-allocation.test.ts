import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSubscriptionAllocation } from "./tiered-subscription-allocation.js";

test("TieredSubscriptionAllocation starts in planned", () => {
  const item = newTieredSubscriptionAllocation("code-133", "title-644");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSubscriptionAllocation moves to completed", () => {
  const item = newTieredSubscriptionAllocation("code-133", "title-644");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredSubscriptionAllocation rejects moves from cancelled", () => {
  const item = newTieredSubscriptionAllocation("code-133", "title-644");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
