import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationCheckpoint } from "./weighted-escalation-checkpoint.js";

test("WeightedEscalationCheckpoint starts in proposed", () => {
  const item = newWeightedEscalationCheckpoint("code-868", "name-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationCheckpoint moves to rejected", () => {
  const item = newWeightedEscalationCheckpoint("code-868", "name-527");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedEscalationCheckpoint rejects moves from withdrawn", () => {
  const item = newWeightedEscalationCheckpoint("code-868", "name-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
