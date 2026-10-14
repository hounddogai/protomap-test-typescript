import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

test("PendingTouchpointEstimate starts in planned", () => {
  const item = newPendingTouchpointEstimate("code-622", "name-32");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingTouchpointEstimate moves to completed", () => {
  const item = newPendingTouchpointEstimate("code-622", "name-32");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PendingTouchpointEstimate rejects moves from cancelled", () => {
  const item = newPendingTouchpointEstimate("code-622", "name-32");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
