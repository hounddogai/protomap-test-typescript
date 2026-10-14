import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

test("WeightedEscalationAdjustment starts in created", () => {
  const item = newWeightedEscalationAdjustment("code-279", "label-559");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationAdjustment moves to published", () => {
  const item = newWeightedEscalationAdjustment("code-279", "label-559");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedEscalationAdjustment rejects moves from retired", () => {
  const item = newWeightedEscalationAdjustment("code-279", "label-559");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
