import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedActivationMetric } from "./capped-activation-metric.js";

test("CappedActivationMetric starts in created", () => {
  const item = newCappedActivationMetric("code-22", "name-191");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedActivationMetric moves to retired", () => {
  const item = newCappedActivationMetric("code-22", "name-191");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CappedActivationMetric rejects moves from retired", () => {
  const item = newCappedActivationMetric("code-22", "name-191");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
