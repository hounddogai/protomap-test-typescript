import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckMetric } from "./fraud-check-metric.js";

test("FraudCheckMetric starts in idle", () => {
  const item = newFraudCheckMetric("code-359", "label-909");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckMetric moves to warming", () => {
  const item = newFraudCheckMetric("code-359", "label-909");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FraudCheckMetric rejects moves from stopped", () => {
  const item = newFraudCheckMetric("code-359", "label-909");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
