import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMacroAssignment } from "./rolling-macro-assignment.js";

test("RollingMacroAssignment starts in draft", () => {
  const item = newRollingMacroAssignment("code-898", "name-932");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMacroAssignment moves to pending", () => {
  const item = newRollingMacroAssignment("code-898", "name-932");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingMacroAssignment rejects moves from closed", () => {
  const item = newRollingMacroAssignment("code-898", "name-932");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
