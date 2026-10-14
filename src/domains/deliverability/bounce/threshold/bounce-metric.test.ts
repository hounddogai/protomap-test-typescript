import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceMetric } from "./bounce-metric.js";

test("BounceMetric starts in planned", () => {
  const item = newBounceMetric("code-229", "title-884");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceMetric moves to scheduled", () => {
  const item = newBounceMetric("code-229", "title-884");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BounceMetric rejects moves from cancelled", () => {
  const item = newBounceMetric("code-229", "title-884");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
