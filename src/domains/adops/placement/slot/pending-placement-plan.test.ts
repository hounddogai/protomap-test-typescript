import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPlacementPlan } from "./pending-placement-plan.js";

test("PendingPlacementPlan starts in open", () => {
  const item = newPendingPlacementPlan("code-615", "title-287");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPlacementPlan moves to in review", () => {
  const item = newPendingPlacementPlan("code-615", "title-287");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingPlacementPlan rejects moves from archived", () => {
  const item = newPendingPlacementPlan("code-615", "title-287");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
