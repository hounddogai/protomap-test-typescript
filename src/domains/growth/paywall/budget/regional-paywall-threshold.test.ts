import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPaywallThreshold } from "./regional-paywall-threshold.js";

test("RegionalPaywallThreshold starts in idle", () => {
  const item = newRegionalPaywallThreshold("code-942", "label-82");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPaywallThreshold moves to warming", () => {
  const item = newRegionalPaywallThreshold("code-942", "label-82");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalPaywallThreshold rejects moves from stopped", () => {
  const item = newRegionalPaywallThreshold("code-942", "label-82");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
