import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPaywallEntry } from "./batched-paywall-entry.js";

test("BatchedPaywallEntry starts in idle", () => {
  const item = newBatchedPaywallEntry("code-708", "name-15");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPaywallEntry moves to warming", () => {
  const item = newBatchedPaywallEntry("code-708", "name-15");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedPaywallEntry rejects moves from stopped", () => {
  const item = newBatchedPaywallEntry("code-708", "name-15");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
