import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelAssignment } from "./level-assignment.js";

test("LevelAssignment starts in planned", () => {
  const item = newLevelAssignment("code-392", "label-238");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelAssignment moves to completed", () => {
  const item = newLevelAssignment("code-392", "label-238");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LevelAssignment rejects moves from cancelled", () => {
  const item = newLevelAssignment("code-392", "label-238");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
