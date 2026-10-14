import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationMetric } from "./reputation-metric.js";

test("ReputationMetric starts in planned", () => {
  const item = newReputationMetric("code-547", "label-877");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationMetric moves to in progress", () => {
  const item = newReputationMetric("code-547", "label-877");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReputationMetric rejects moves from cancelled", () => {
  const item = newReputationMetric("code-547", "label-877");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
