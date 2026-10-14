import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

test("DefaultFraudCheckPlan starts in planned", () => {
  const item = newDefaultFraudCheckPlan("code-721", "name-816");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFraudCheckPlan moves to in progress", () => {
  const item = newDefaultFraudCheckPlan("code-721", "name-816");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultFraudCheckPlan rejects moves from cancelled", () => {
  const item = newDefaultFraudCheckPlan("code-721", "name-816");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
