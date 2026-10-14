import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryOptOutMetric } from "./primary-opt-out-metric.js";

test("PrimaryOptOutMetric starts in idle", () => {
  const item = newPrimaryOptOutMetric("code-582", "name-839");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryOptOutMetric moves to draining", () => {
  const item = newPrimaryOptOutMetric("code-582", "name-839");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimaryOptOutMetric rejects moves from stopped", () => {
  const item = newPrimaryOptOutMetric("code-582", "name-839");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
