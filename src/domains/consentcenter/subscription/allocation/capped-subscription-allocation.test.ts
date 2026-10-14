import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

test("CappedSubscriptionAllocation starts in idle", () => {
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSubscriptionAllocation moves to ready", () => {
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CappedSubscriptionAllocation rejects moves from stopped", () => {
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
