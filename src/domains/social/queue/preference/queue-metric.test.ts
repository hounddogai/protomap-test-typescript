import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueMetric } from "./queue-metric.js";

test("QueueMetric starts in planned", () => {
  const item = newQueueMetric("code-713", "name-312");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueMetric moves to cancelled", () => {
  const item = newQueueMetric("code-713", "name-312");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("QueueMetric rejects moves from cancelled", () => {
  const item = newQueueMetric("code-713", "name-312");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
