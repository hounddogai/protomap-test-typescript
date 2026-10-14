import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallMetric } from "./paywall-metric.js";

test("PaywallMetric starts in proposed", () => {
  const item = newPaywallMetric("code-104", "label-550");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallMetric moves to rejected", () => {
  const item = newPaywallMetric("code-104", "label-550");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PaywallMetric rejects moves from withdrawn", () => {
  const item = newPaywallMetric("code-104", "label-550");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
