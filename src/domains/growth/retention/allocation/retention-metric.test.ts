import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionMetric } from "./retention-metric.js";

test("RetentionMetric starts in idle", () => {
  const item = newRetentionMetric("code-852", "name-127");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionMetric moves to draining", () => {
  const item = newRetentionMetric("code-852", "name-127");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RetentionMetric rejects moves from stopped", () => {
  const item = newRetentionMetric("code-852", "name-127");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
