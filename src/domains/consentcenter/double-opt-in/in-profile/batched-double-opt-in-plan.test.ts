import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("BatchedDoubleOptInPlan starts in idle", () => {
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDoubleOptInPlan moves to warming", () => {
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedDoubleOptInPlan rejects moves from stopped", () => {
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
