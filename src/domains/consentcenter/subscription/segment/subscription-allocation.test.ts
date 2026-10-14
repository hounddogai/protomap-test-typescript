import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionAllocation } from "./subscription-allocation.js";

test("SubscriptionAllocation starts in idle", () => {
  const item = newSubscriptionAllocation("code-379", "title-875");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionAllocation moves to draining", () => {
  const item = newSubscriptionAllocation("code-379", "title-875");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SubscriptionAllocation rejects moves from stopped", () => {
  const item = newSubscriptionAllocation("code-379", "title-875");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
