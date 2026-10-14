import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("ManualFraudCheckPlan starts in new", () => {
  const item = newManualFraudCheckPlan("code-71", "title-720");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFraudCheckPlan moves to queued", () => {
  const item = newManualFraudCheckPlan("code-71", "title-720");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualFraudCheckPlan rejects moves from failed", () => {
  const item = newManualFraudCheckPlan("code-71", "title-720");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
