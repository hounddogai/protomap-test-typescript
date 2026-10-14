import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

test("ManualTouchpointAssignment starts in requested", () => {
  const item = newManualTouchpointAssignment("code-956", "name-254");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTouchpointAssignment moves to granted", () => {
  const item = newManualTouchpointAssignment("code-956", "name-254");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualTouchpointAssignment rejects moves from expired", () => {
  const item = newManualTouchpointAssignment("code-956", "name-254");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
