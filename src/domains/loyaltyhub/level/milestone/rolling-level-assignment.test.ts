import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLevelAssignment } from "./rolling-level-assignment.js";

test("RollingLevelAssignment starts in planned", () => {
  const item = newRollingLevelAssignment("code-945", "name-446");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLevelAssignment moves to in progress", () => {
  const item = newRollingLevelAssignment("code-945", "name-446");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingLevelAssignment rejects moves from cancelled", () => {
  const item = newRollingLevelAssignment("code-945", "name-446");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
