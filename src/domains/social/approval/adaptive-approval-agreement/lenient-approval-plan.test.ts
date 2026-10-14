import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientApprovalPlan } from "./lenient-approval-plan.js";

test("LenientApprovalPlan starts in planned", () => {
  const item = newLenientApprovalPlan("code-507", "name-869");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientApprovalPlan moves to scheduled", () => {
  const item = newLenientApprovalPlan("code-507", "name-869");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientApprovalPlan rejects moves from cancelled", () => {
  const item = newLenientApprovalPlan("code-507", "name-869");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
