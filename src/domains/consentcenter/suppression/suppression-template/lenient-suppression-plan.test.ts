import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSuppressionPlan } from "./lenient-suppression-plan.js";

test("LenientSuppressionPlan starts in new", () => {
  const item = newLenientSuppressionPlan("code-886", "label-676");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSuppressionPlan moves to running", () => {
  const item = newLenientSuppressionPlan("code-886", "label-676");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientSuppressionPlan rejects moves from failed", () => {
  const item = newLenientSuppressionPlan("code-886", "label-676");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
