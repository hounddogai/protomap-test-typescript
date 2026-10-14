import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalQueueMetric } from "./seasonal-queue-metric.js";

test("SeasonalQueueMetric starts in new", () => {
  const item = newSeasonalQueueMetric("code-700", "title-200");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalQueueMetric moves to running", () => {
  const item = newSeasonalQueueMetric("code-700", "title-200");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("SeasonalQueueMetric rejects moves from failed", () => {
  const item = newSeasonalQueueMetric("code-700", "title-200");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
