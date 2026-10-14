import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPaywallMetric } from "./capped-paywall-metric.js";

test("CappedPaywallMetric starts in proposed", () => {
  const item = newCappedPaywallMetric("code-825", "title-434");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPaywallMetric moves to rejected", () => {
  const item = newCappedPaywallMetric("code-825", "title-434");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CappedPaywallMetric rejects moves from withdrawn", () => {
  const item = newCappedPaywallMetric("code-825", "title-434");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
