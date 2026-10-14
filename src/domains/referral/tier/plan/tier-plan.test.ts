import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierPlan } from "./tier-plan.js";

test("TierPlan starts in created", () => {
  const item = newTierPlan("code-422", "label-453");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierPlan moves to validated", () => {
  const item = newTierPlan("code-422", "label-453");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TierPlan rejects moves from retired", () => {
  const item = newTierPlan("code-422", "label-453");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
