import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedNudgeMetric } from "./weighted-nudge-metric.js";

test("WeightedNudgeMetric starts in proposed", () => {
  const item = newWeightedNudgeMetric("code-368", "name-629");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedNudgeMetric moves to approved", () => {
  const item = newWeightedNudgeMetric("code-368", "name-629");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedNudgeMetric rejects moves from withdrawn", () => {
  const item = newWeightedNudgeMetric("code-368", "name-629");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
