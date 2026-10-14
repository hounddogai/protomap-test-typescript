import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionPlan } from "./suppression-plan.js";

test("SuppressionPlan starts in planned", () => {
  const item = newSuppressionPlan("code-723", "label-478");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionPlan moves to scheduled", () => {
  const item = newSuppressionPlan("code-723", "label-478");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SuppressionPlan rejects moves from cancelled", () => {
  const item = newSuppressionPlan("code-723", "label-478");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
