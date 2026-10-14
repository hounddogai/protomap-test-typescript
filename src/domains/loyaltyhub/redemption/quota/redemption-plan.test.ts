import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionPlan } from "./redemption-plan.js";

test("RedemptionPlan starts in new", () => {
  const item = newRedemptionPlan("code-19", "name-507");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionPlan moves to failed", () => {
  const item = newRedemptionPlan("code-19", "name-507");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RedemptionPlan rejects moves from failed", () => {
  const item = newRedemptionPlan("code-19", "name-507");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
