import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPaywallMetric } from "./legacy-paywall-metric.js";

test("LegacyPaywallMetric starts in idle", () => {
  const item = newLegacyPaywallMetric("code-110", "title-392");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPaywallMetric moves to warming", () => {
  const item = newLegacyPaywallMetric("code-110", "title-392");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyPaywallMetric rejects moves from stopped", () => {
  const item = newLegacyPaywallMetric("code-110", "title-392");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
