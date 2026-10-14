import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePaywallThreshold } from "./adaptive-paywall-threshold.js";

test("AdaptivePaywallThreshold starts in draft", () => {
  const item = newAdaptivePaywallThreshold("code-737", "name-117");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePaywallThreshold moves to pending", () => {
  const item = newAdaptivePaywallThreshold("code-737", "name-117");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptivePaywallThreshold rejects moves from closed", () => {
  const item = newAdaptivePaywallThreshold("code-737", "name-117");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
