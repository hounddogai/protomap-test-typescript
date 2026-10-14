import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyMetric } from "./frequency-metric.js";

test("FrequencyMetric starts in planned", () => {
  const item = newFrequencyMetric("code-35", "name-977");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyMetric moves to cancelled", () => {
  const item = newFrequencyMetric("code-35", "name-977");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("FrequencyMetric rejects moves from cancelled", () => {
  const item = newFrequencyMetric("code-35", "name-977");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
