import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalLevelAssignment } from "./global-level-assignment.js";

test("GlobalLevelAssignment starts in new", () => {
  const item = newGlobalLevelAssignment("code-463", "name-550");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalLevelAssignment moves to running", () => {
  const item = newGlobalLevelAssignment("code-463", "name-550");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("GlobalLevelAssignment rejects moves from failed", () => {
  const item = newGlobalLevelAssignment("code-463", "name-550");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
