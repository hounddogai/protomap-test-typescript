import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

test("AdaptiveComplaintMetric starts in new", () => {
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintMetric moves to queued", () => {
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveComplaintMetric rejects moves from failed", () => {
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
