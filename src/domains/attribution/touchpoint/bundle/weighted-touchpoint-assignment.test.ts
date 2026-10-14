import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

test("WeightedTouchpointAssignment starts in requested", () => {
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTouchpointAssignment moves to expired", () => {
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedTouchpointAssignment rejects moves from expired", () => {
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
