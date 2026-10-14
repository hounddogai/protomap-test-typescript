import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("AdaptiveRedemptionPlan starts in draft", () => {
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRedemptionPlan moves to active", () => {
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptiveRedemptionPlan rejects moves from closed", () => {
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
