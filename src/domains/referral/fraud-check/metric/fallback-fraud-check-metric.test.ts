import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

test("FallbackFraudCheckMetric starts in proposed", () => {
  const item = newFallbackFraudCheckMetric("code-769", "name-707");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckMetric moves to approved", () => {
  const item = newFallbackFraudCheckMetric("code-769", "name-707");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackFraudCheckMetric rejects moves from withdrawn", () => {
  const item = newFallbackFraudCheckMetric("code-769", "name-707");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
