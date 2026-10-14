import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepAssignment } from "./rolling-step-assignment.js";

test("RollingStepAssignment starts in new", () => {
  const item = newRollingStepAssignment("code-482", "title-389");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepAssignment moves to queued", () => {
  const item = newRollingStepAssignment("code-482", "title-389");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingStepAssignment rejects moves from failed", () => {
  const item = newRollingStepAssignment("code-482", "title-389");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
