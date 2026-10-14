import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

test("CappedFraudCheckPlan starts in new", () => {
  const item = newCappedFraudCheckPlan("code-188", "label-235");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFraudCheckPlan moves to failed", () => {
  const item = newCappedFraudCheckPlan("code-188", "label-235");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("CappedFraudCheckPlan rejects moves from failed", () => {
  const item = newCappedFraudCheckPlan("code-188", "label-235");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
