import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSubscriptionPlan } from "./default-subscription-plan.js";

test("DefaultSubscriptionPlan starts in planned", () => {
  const item = newDefaultSubscriptionPlan("code-96", "label-320");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSubscriptionPlan moves to completed", () => {
  const item = newDefaultSubscriptionPlan("code-96", "label-320");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DefaultSubscriptionPlan rejects moves from cancelled", () => {
  const item = newDefaultSubscriptionPlan("code-96", "label-320");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
