import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

test("WeightedEscalationVariance starts in new", () => {
  const item = newWeightedEscalationVariance("code-461", "label-53");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationVariance moves to queued", () => {
  const item = newWeightedEscalationVariance("code-461", "label-53");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedEscalationVariance rejects moves from failed", () => {
  const item = newWeightedEscalationVariance("code-461", "label-53");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
