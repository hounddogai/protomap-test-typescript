import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

test("LegacyPaywallThreshold starts in draft", () => {
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPaywallThreshold moves to pending", () => {
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacyPaywallThreshold rejects moves from closed", () => {
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
