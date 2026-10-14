import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

test("BatchedFrequencyMetric starts in requested", () => {
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFrequencyMetric moves to granted", () => {
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedFrequencyMetric rejects moves from expired", () => {
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
