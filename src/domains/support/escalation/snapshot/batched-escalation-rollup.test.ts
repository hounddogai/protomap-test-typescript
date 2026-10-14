import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

test("BatchedEscalationRollup starts in planned", () => {
  const item = newBatchedEscalationRollup("code-65", "title-137");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedEscalationRollup moves to scheduled", () => {
  const item = newBatchedEscalationRollup("code-65", "title-137");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedEscalationRollup rejects moves from cancelled", () => {
  const item = newBatchedEscalationRollup("code-65", "title-137");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
