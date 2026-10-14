import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

test("GlobalTouchpointPlan starts in requested", () => {
  const item = newGlobalTouchpointPlan("code-401", "name-962");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalTouchpointPlan moves to granted", () => {
  const item = newGlobalTouchpointPlan("code-401", "name-962");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalTouchpointPlan rejects moves from expired", () => {
  const item = newGlobalTouchpointPlan("code-401", "name-962");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
