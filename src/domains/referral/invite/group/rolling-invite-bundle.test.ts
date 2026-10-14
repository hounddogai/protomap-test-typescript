import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingInviteBundle } from "./rolling-invite-bundle.js";

test("RollingInviteBundle starts in idle", () => {
  const item = newRollingInviteBundle("code-721", "name-336");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingInviteBundle moves to ready", () => {
  const item = newRollingInviteBundle("code-721", "name-336");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RollingInviteBundle rejects moves from stopped", () => {
  const item = newRollingInviteBundle("code-721", "name-336");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
