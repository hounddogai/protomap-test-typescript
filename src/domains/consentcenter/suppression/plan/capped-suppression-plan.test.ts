import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSuppressionPlan } from "./capped-suppression-plan.js";

test("CappedSuppressionPlan starts in requested", () => {
  const item = newCappedSuppressionPlan("code-794", "label-514");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSuppressionPlan moves to granted", () => {
  const item = newCappedSuppressionPlan("code-794", "label-514");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedSuppressionPlan rejects moves from expired", () => {
  const item = newCappedSuppressionPlan("code-794", "label-514");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
