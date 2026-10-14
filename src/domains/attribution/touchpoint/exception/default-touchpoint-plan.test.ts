import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultTouchpointPlan } from "./default-touchpoint-plan.js";

test("DefaultTouchpointPlan starts in planned", () => {
  const item = newDefaultTouchpointPlan("code-529", "name-683");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultTouchpointPlan moves to in progress", () => {
  const item = newDefaultTouchpointPlan("code-529", "name-683");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultTouchpointPlan rejects moves from cancelled", () => {
  const item = newDefaultTouchpointPlan("code-529", "name-683");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
