import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallBatch } from "./paywall-batch.js";

test("PaywallBatch starts in new", () => {
  const item = newPaywallBatch("code-364", "title-38");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallBatch moves to running", () => {
  const item = newPaywallBatch("code-364", "title-38");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PaywallBatch rejects moves from failed", () => {
  const item = newPaywallBatch("code-364", "title-38");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
