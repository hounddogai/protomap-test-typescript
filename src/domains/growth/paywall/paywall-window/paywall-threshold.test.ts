import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallThreshold } from "./paywall-threshold.js";

test("PaywallThreshold starts in new", () => {
  const item = newPaywallThreshold("code-991", "label-809");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallThreshold moves to running", () => {
  const item = newPaywallThreshold("code-991", "label-809");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PaywallThreshold rejects moves from failed", () => {
  const item = newPaywallThreshold("code-991", "label-809");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
