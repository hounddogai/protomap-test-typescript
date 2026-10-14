import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckPlan } from "./fraud-check-plan.js";

test("FraudCheckPlan starts in proposed", () => {
  const item = newFraudCheckPlan("code-317", "label-562");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckPlan moves to rejected", () => {
  const item = newFraudCheckPlan("code-317", "label-562");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FraudCheckPlan rejects moves from withdrawn", () => {
  const item = newFraudCheckPlan("code-317", "label-562");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
