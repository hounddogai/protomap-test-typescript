import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallAllocation } from "./paywall-allocation.js";

test("PaywallAllocation starts in idle", () => {
  const item = newPaywallAllocation("code-776", "name-519");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallAllocation moves to warming", () => {
  const item = newPaywallAllocation("code-776", "name-519");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PaywallAllocation rejects moves from stopped", () => {
  const item = newPaywallAllocation("code-776", "name-519");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
