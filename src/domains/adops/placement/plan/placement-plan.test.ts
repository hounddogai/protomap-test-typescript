import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementPlan } from "./placement-plan.js";

test("PlacementPlan starts in new", () => {
  const item = newPlacementPlan("code-3", "name-486");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementPlan moves to done", () => {
  const item = newPlacementPlan("code-3", "name-486");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PlacementPlan rejects moves from failed", () => {
  const item = newPlacementPlan("code-3", "name-486");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
