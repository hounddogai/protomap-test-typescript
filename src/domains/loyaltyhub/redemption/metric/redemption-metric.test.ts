import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionMetric } from "./redemption-metric.js";

test("RedemptionMetric starts in requested", () => {
  const item = newRedemptionMetric("code-787", "label-744");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionMetric moves to granted", () => {
  const item = newRedemptionMetric("code-787", "label-744");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RedemptionMetric rejects moves from expired", () => {
  const item = newRedemptionMetric("code-787", "label-744");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
