import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderAssignment } from "./sender-assignment.js";

test("SenderAssignment starts in idle", () => {
  const item = newSenderAssignment("code-58", "name-981");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderAssignment moves to ready", () => {
  const item = newSenderAssignment("code-58", "name-981");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SenderAssignment rejects moves from stopped", () => {
  const item = newSenderAssignment("code-58", "name-981");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
