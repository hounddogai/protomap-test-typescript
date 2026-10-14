import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierMetric } from "./tier-metric.js";

test("TierMetric starts in new", () => {
  const item = newTierMetric("code-892", "label-40");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierMetric moves to failed", () => {
  const item = newTierMetric("code-892", "label-40");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TierMetric rejects moves from failed", () => {
  const item = newTierMetric("code-892", "label-40");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
